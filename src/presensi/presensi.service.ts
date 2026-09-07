import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class PresensiService {
  constructor(private prisma: PrismaService) {}

  /** Batas telat jam 07:00 */
  async checkIn(siswaUserId: number, catatan?: string) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    const now = new Date();
    const tanggal = new Date(now.toISOString().slice(0, 10));

    const existing = await this.prisma.presensi.findUnique({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } },
    });
    if (existing) {
      throw new BadRequestException('Anda sudah check-in hari ini');
    }

    const batasTelat = new Date(tanggal);
    batasTelat.setHours(7, 0, 0, 0);

    return this.prisma.presensi.create({
      data: {
        siswaId: siswa.id,
        tanggal,
        checkInAt: now,
        status: now > batasTelat ? 'TERLAMBAT' : 'HADIR',
        catatan: catatan ?? null,
      },
    });
  }

  async myHistory(siswaUserId: number, opts: { page?: number; limit?: number }) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.presensi.count({ where: { siswaId: siswa.id } }),
      this.prisma.presensi.findMany({
        where: { siswaId: siswa.id },
        orderBy: { tanggal: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const rekap = await this.prisma.presensi.groupBy({
      by: ['status'],
      where: { siswaId: siswa.id },
      _count: true,
    });

    const ringkasan = Object.fromEntries(
      rekap.map((r) => [r.status, r._count]),
    );

    return {
      data,
      ringkasan,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async rekapHarian(opts: { kelasId?: number; tanggal?: string }) {    const tanggal = opts.tanggal
      ? new Date(opts.tanggal)
      : new Date(new Date().toISOString().slice(0, 10));

    const siswaWhere = opts.kelasId ? { kelasId: opts.kelasId } : {};

    const siswaList = await this.prisma.siswa.findMany({
      where: siswaWhere,
      include: {
        user: { select: { nama: true } },
        kelas: { select: { nama: true } },
        presensi: { where: { tanggal } },
      },
      orderBy: { nis: 'asc' },
    });

    return siswaList.map((s) => ({
      siswaId: s.id,
      nis: s.nis,
      nama: s.user.nama,
      kelas: s.kelas?.nama ?? '-',
      status: s.presensi[0]?.status ?? 'ALPA',
      checkInAt: s.presensi[0]?.checkInAt ?? null,
      sudahCheckIn: s.presensi.length > 0,
    }));
  }

  /**
   * Pencatatan manual oleh sekretaris (hanya kelasnya sendiri),
   * guru, atau admin. Upsert per (siswaId, tanggal).
   */
  async catat(
    pencatat: { userId: number; role: string },
    dto: { siswaId: number; tanggal?: string; status: string; catatan?: string },
  ) {
    if (pencatat.role === 'SEKRETARIS') {
      const sekretaris = await this.prisma.sekretaris.findUnique({
        where: { userId: pencatat.userId },
      });
      if (!sekretaris) {
        throw new ForbiddenException('Akun ini bukan sekretaris aktif');
      }
      const siswa = await this.prisma.siswa.findUnique({
        where: { id: dto.siswaId },
      });
      if (!siswa || siswa.kelasId !== sekretaris.kelasId) {
        throw new ForbiddenException(
          'Anda hanya boleh mencatat presensi kelas Anda sendiri',
        );
      }
    }

    const tanggal = dto.tanggal
      ? new Date(dto.tanggal)
      : new Date(new Date().toISOString().slice(0, 10));

    const existing = await this.prisma.presensi.findUnique({
      where: { siswaId_tanggal: { siswaId: dto.siswaId, tanggal } },
    });

    const withCheckIn =
      dto.status === 'HADIR' || dto.status === 'TERLAMBAT';

    if (existing) {
      return this.prisma.presensi.update({
        where: { id: existing.id },
        data: {
          status: dto.status as never,
          catatan: dto.catatan ?? existing.catatan,
          checkInAt:
            withCheckIn && !existing.checkInAt ? new Date() : existing.checkInAt,
        },
      });
    }

    return this.prisma.presensi.create({
      data: {
        siswaId: dto.siswaId,
        tanggal,
        status: dto.status as never,
        checkInAt: withCheckIn ? new Date() : null,
        catatan: dto.catatan ?? null,
      },
    });
  }

  /** Rekap harian khusus sekretaris — selalu lingkup kelasnya sendiri. */
  async rekapSekretaris(sekretarisUserId: number, tanggal?: string) {
    const sekretaris = await this.prisma.sekretaris.findUnique({
      where: { userId: sekretarisUserId },
    });
    if (!sekretaris) {
      throw new ForbiddenException('Akun ini bukan sekretaris aktif');
    }
    return this.rekapHarian({ kelasId: sekretaris.kelasId, tanggal });
  }
}
