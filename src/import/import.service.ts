import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
import { ImportGuruDto, ImportSiswaDto } from './dto';

export const DEFAULT_IMPORT_PASSWORD = 'password123';

export interface SkippedRow {
  row: number;
  reason: string;
}

/** "X IPA 1" -> "10", "11 IPS 2" -> "11", tanpa angka -> "10". */
export function tingkatDariNama(nama: string): string {
  const digits = nama.match(/\d+/);
  if (digits) return digits[0];
  const upper = ` ${nama.toUpperCase()} `;
  for (const [romawi, angka] of [
    ['XII', '12'],
    ['XI', '11'],
    ['VIII', '8'],
    ['VII', '7'],
    ['IX', '9'],
    ['III', '3'],
    ['II', '2'],
    ['IV', '4'],
    ['VI', '6'],
    ['X', '10'],
    ['V', '5'],
    ['I', '1'],
  ] as const) {
    if (upper.includes(` ${romawi} `)) return angka;
  }
  return '10';
}

function slugEmail(nama: string): string {
  const slug = nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${slug || 'guru'}`;
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private async findOrCreateKelas(nama: string) {
    const existing = await this.prisma.kelas.findUnique({
      where: { nama },
    });
    if (existing) return { kelas: existing, created: false };
    const kelas = await this.prisma.kelas.create({
      data: { nama, tingkat: tingkatDariNama(nama) },
    });
    return { kelas, created: true };
  }

  private slugKode(nama: string): string {
    const slug = nama
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 8);
    return `${slug || 'MPL'}-${Date.now().toString(36).toUpperCase()}`;
  }

  private async findOrCreateMapel(nama: string) {
    const existing = await this.prisma.mataPelajaran.findUnique({
      where: { nama },
    });
    if (existing) return existing;
    return this.prisma.mataPelajaran.create({
      data: { nama, kode: this.slugKode(nama) },
    });
  }

  async importSiswa(dto: ImportSiswaDto) {
    const password = await bcrypt.hash(DEFAULT_IMPORT_PASSWORD, 10);
    let added = 0;
    const skipped: SkippedRow[] = [];
    const created: Record<string, unknown>[] = [];
    const createdKelas: Record<string, unknown>[] = [];
    const seenKelas = new Set<string>();

    for (let i = 0; i < dto.rows.length; i++) {
      const rowNo = i + 2; // + header Excel
      const nama = dto.rows[i].nama?.trim() ?? '';
      const nis = String(dto.rows[i].nis ?? '').trim();
      const kelasNama = dto.rows[i].kelasNama?.trim() ?? '';

      if (!nama || !nis || !kelasNama) {
        skipped.push({ row: rowNo, reason: 'Nama, NIS, atau Kelas kosong' });
        continue;
      }
      const nisExists = await this.prisma.siswa.findUnique({ where: { nis } });
      if (nisExists) {
        skipped.push({ row: rowNo, reason: `NIS ${nis} sudah terdaftar` });
        continue;
      }
      const email = `${nis}@student.sysch.id`;
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        skipped.push({ row: rowNo, reason: `Email ${email} sudah terpakai` });
        continue;
      }

      const { kelas, created: kelasBaru } = await this.findOrCreateKelas(kelasNama);
      if (kelasBaru && !seenKelas.has(kelas.nama)) {
        seenKelas.add(kelas.nama);
        createdKelas.push({ id: String(kelas.id), nama: kelas.nama, waliKelasId: null });
      }

      const user = await this.prisma.user.create({
        data: {
          email,
          password,
          nama,
          role: 'SISWA',
          siswa: { create: { nis, kelasId: kelas.id } },
        },
        include: { siswa: true },
      });
      created.push({
        id: String(user.siswa!.id),
        nama,
        nis,
        kelasId: String(kelas.id),
      });
      added += 1;
    }

    return { added, skipped, createdKelas, created };
  }

  async importGuru(dto: ImportGuruDto) {
    const password = await bcrypt.hash(DEFAULT_IMPORT_PASSWORD, 10);
    let added = 0;
    const skipped: SkippedRow[] = [];
    const created: Record<string, unknown>[] = [];
    const createdKelas: Record<string, unknown>[] = [];
    const seenKelas = new Set<string>();

    for (let i = 0; i < dto.rows.length; i++) {
      const rowNo = i + 2;
      const nama = dto.rows[i].nama?.trim() ?? '';
      const mapel = (dto.rows[i].mapel ?? []).map((m) => m.trim()).filter(Boolean);
      const waliKelasNama = dto.rows[i].waliKelasNama?.trim() || null;

      if (!nama || mapel.length === 0) {
        skipped.push({ row: rowNo, reason: 'Nama atau Mata Pelajaran kosong' });
        continue;
      }
      const email = `${slugEmail(nama)}@guru.sysch.id`;
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        skipped.push({ row: rowNo, reason: `Email ${email} sudah terpakai` });
        continue;
      }
      const nip = `NIP-${Date.now().toString(36).toUpperCase()}-${i}`;

      const user = await this.prisma.user.create({
        data: {
          email,
          password,
          nama,
          role: 'GURU',
          guru: { create: { nip } },
        },
        include: { guru: true },
      });

      // Mapel di-resolve (dibuat bila belum ada) lalu dipasangkan ke guru.
      const mapelIds: number[] = [];
      for (const namaMapel of mapel) {
        const mapelRec = await this.findOrCreateMapel(namaMapel);
        mapelIds.push(mapelRec.id);
      }
      if (mapelIds.length > 0) {
        await this.prisma.guruMapel.createMany({
          data: [...new Set(mapelIds)].map((mapelId) => ({
            guruId: user.guru!.id,
            mapelId,
          })),
          skipDuplicates: true,
        });
      }

      // mapel tidak ada relasinya di backend — dikembalikan apa adanya
      // agar frontend tetap menyimpannya secara lokal.
      let waliKelasId: string | null = null;
      if (waliKelasNama) {
        const { kelas, created: kelasBaru } = await this.findOrCreateKelas(waliKelasNama);
        await this.prisma.kelas.update({
          where: { id: kelas.id },
          data: { waliId: user.guru!.id },
        });
        if (kelasBaru && !seenKelas.has(kelas.nama)) {
          seenKelas.add(kelas.nama);
          createdKelas.push({ id: String(kelas.id), nama: kelas.nama, waliKelasId: null });
        }
        waliKelasId = String(kelas.id);
      }

      created.push({
        id: String(user.guru!.id),
        nama,
        mapel: mapel.join(', '),
        waliKelasId,
      });
      added += 1;
    }

    return { added, skipped, createdKelas, created };
  }
}
