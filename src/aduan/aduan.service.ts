import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreateAduanDto, UpdateAduanDto } from './dto';

@Injectable()
export class AduanService {
  constructor(private prisma: PrismaService) {}

  /** Semua user (terutama siswa) bisa bikin aduan */
  async create(pelaporId: number, dto: CreateAduanDto) {
    return this.prisma.aduan.create({
      data: {
        pelaporId,
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        kategori: dto.kategori as never,
        prioritas: (dto.prioritas as never) ?? 'SEDANG',
        lampiranUrl: dto.lampiranUrl ?? null,
        isAnonim: dto.isAnonim ?? false,
      },
      // email untuk fallback UI bila nama kosong (Task 2).
      include: { pelapor: { select: { nama: true, email: true, role: true } } },
    });
  }

  /** Tiket milik user yang login */
  async myTickets(
    userId: number,
    opts: { page?: number; limit?: number },
  ) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.aduan.count({ where: { pelaporId: userId } }),
      this.prisma.aduan.findMany({
        where: { pelaporId: userId },
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

  /** Semua tiket untuk admin */
  async findAll(opts: {
    status?: string;
    prioritas?: string;
    page?: number;
    limit?: number;
  }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const where: Record<string, unknown> = {};
    if (
      opts.status &&
      ['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK'].includes(opts.status)
    ) {
      where.status = opts.status;
    }
    if (opts.prioritas && ['RENDAH', 'SEDANG', 'TINGGI'].includes(opts.prioritas)) {
      where.prioritas = opts.prioritas;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.aduan.count({ where }),
      this.prisma.aduan.findMany({
        where,
        include: { pelapor: { select: { nama: true, email: true, role: true } } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Hormati anonimitas: nama pelapor disamarkan di daftar admin.
    return {
      data: rows.map((r) => ({
        ...r,
        pelapor: r.isAnonim ? null : r.pelapor,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const aduan = await this.prisma.aduan.findUnique({
      where: { id },
      include: {
        pelapor: { select: { nama: true, email: true, role: true } },
        penanggap: { select: { nama: true } },
      },
    });
    if (!aduan) throw new NotFoundException('Tiket aduan tidak ditemukan');
    return aduan;
  }

  /** Admin update status/prioritas/tanggapan */
  async update(id: number, adminUserId: number, dto: UpdateAduanDto) {
    const aduan = await this.prisma.aduan.findUnique({ where: { id } });
    if (!aduan) throw new NotFoundException('Tiket aduan tidak ditemukan');

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'SELESAI' || dto.status === 'DIPROSES') {
        data.penanggapId = adminUserId;
      }
    }
    if (dto.prioritas !== undefined) data.prioritas = dto.prioritas;
    if (dto.tanggapan !== undefined) data.tanggapan = dto.tanggapan;

    return this.prisma.aduan.update({
      where: { id },
      data,
      include: { pelapor: { select: { nama: true, email: true } } },
    });
  }
}
