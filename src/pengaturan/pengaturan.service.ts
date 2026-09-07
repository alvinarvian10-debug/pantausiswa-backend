import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { UpdatePengaturanDto } from './dto';

const DEFAULTS = {
  namaSekolah: 'SMA Negeri 1 Harapan Bangsa',
  npsn: '20123456',
  alamat: 'Jl. Pendidikan No. 45, Kediri, Jawa Timur',
  tahunAjaran: '2026/2027',
  semester: 'Ganjil',
  kepalaSekolah: 'Dr. Suryanto, M.Pd.',
  jamMasuk: '07:00',
  batasToleransi: 15,
  notifikasiWA: true,
  notifikasiEmail: false,
};

@Injectable()
export class PengaturanService {
  constructor(private prisma: PrismaService) {}

  /** Profil sekolah (baris tunggal, dibuat otomatis bila belum ada). */
  async get() {
    const existing = await this.prisma.pengaturan.findUnique({
      where: { id: 1 },
    });
    if (existing) return existing;
    return this.prisma.pengaturan.create({ data: { id: 1, ...DEFAULTS } });
  }

  async update(dto: UpdatePengaturanDto) {
    await this.get();
    return this.prisma.pengaturan.update({ where: { id: 1 }, data: dto });
  }
}
