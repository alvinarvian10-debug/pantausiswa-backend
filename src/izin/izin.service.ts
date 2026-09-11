import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
import { CreateIzinDto, ReviewIzinDto } from './dto';

@Injectable()
export class IzinService {
  constructor(private prisma: PrismaService) {}

  async create(siswaUserId: number, dto: CreateIzinDto) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    const mulai = new Date(dto.tanggalMulai);
    const selesai = new Date(dto.tanggalSelesai);
    if (selesai < mulai) {
      throw new BadRequestException(
        'Tanggal selesai tidak boleh sebelum tanggal mulai',
      );
    }

    return this.prisma.pengajuanIzin.create({
      data: {
        siswaId: siswa.id,
        jenis: dto.jenis as never,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        keterangan: dto.keterangan,
        lampiranUrl: dto.lampiranUrl ?? null,
      },
      include: { siswa: { include: { user: { select: { nama: true, email: true } } } } },
    });
  }

  async myHistory(
    siswaUserId: number,
    opts: { page?: number; limit?: number },
  ) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.pengajuanIzin.count({ where: { siswaId: siswa.id } }),
      this.prisma.pengajuanIzin.findMany({
        where: { siswaId: siswa.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Daftar pengajuan untuk guru/admin */
  async findAll(opts: { status?: string; page?: number; limit?: number }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const where: Prisma.PengajuanIzinWhereInput = {};
    if (
      opts.status &&
      ['MENUNGGU', 'DISETUJUI', 'DITOLAK'].includes(opts.status)
    ) {
      where.status = opts.status as never;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.pengajuanIzin.count({ where }),
      this.prisma.pengajuanIzin.findMany({
        where,
        include: {
          siswa: {
            include: {
              user: { select: { nama: true, email: true } },
              kelas: { select: { nama: true } },
            },
          },
          reviewer: { include: { user: { select: { nama: true, email: true } } } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Approve/reject oleh guru.
   * Kalau DISETUJUI -> otomatis buat presensi IZIN/SAKIT
   * di rentang tanggal yang diajukan (skip kalau sudah ada).
   */
  async review(izinId: number, guruUserId: number, dto: ReviewIzinDto) {
    const izin = await this.prisma.pengajuanIzin.findUnique({
      where: { id: izinId },
    });
    if (!izin) throw new NotFoundException('Pengajuan izin tidak ditemukan');
    if (izin.status !== 'MENUNGGU') {
      throw new BadRequestException('Pengajuan ini sudah direview sebelumnya');
    }

    const guru = await this.prisma.guru.findUnique({
      where: { userId: guruUserId },
    });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.pengajuanIzin.update({
        where: { id: izinId },
        data: {
          status: dto.status,
          reviewerId: guru?.id ?? null,
          catatanReview: dto.catatanReview ?? null,
          reviewedAt: new Date(),
        },
      });

      if (dto.status === 'DISETUJUI') {
        // Sinkronisasi presensi di rentang izin
        const dates: Date[] = [];
        const cursor = new Date(izin.tanggalMulai);
        while (cursor <= izin.tanggalSelesai) {
          dates.push(new Date(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }

        const mapelStatus =
          izin.jenis === 'SAKIT'
            ? 'SAKIT'
            : izin.jenis === 'DISPENSASI'
              ? 'IZIN'
              : 'IZIN';

        for (const tanggal of dates) {
          await tx.presensi.upsert({
            where: {
              siswaId_tanggal: {
                siswaId: izin.siswaId,
                tanggal,
              },
            },
            create: {
              siswaId: izin.siswaId,
              tanggal,
              status: mapelStatus as never,
              catatan: `Otomatis dari pengajuan ${izin.jenis.toLowerCase()} #${izin.id}`,
            },
            update: { status: mapelStatus as never },
          });
        }
      }

      return updated;
    });
  }
}
