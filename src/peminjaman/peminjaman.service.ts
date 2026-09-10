import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreatePeminjamanDto, ReviewPeminjamanDto } from './dto';

@Injectable()
export class PeminjamanService {
  constructor(private prisma: PrismaService) {}

  /** Siswa mengajukan peminjaman barang */
  async create(siswaUserId: number, dto: CreatePeminjamanDto) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    const barang = await this.prisma.barang.findUnique({
      where: { id: dto.barangId },
    });
    if (!barang) throw new NotFoundException('Barang tidak ditemukan');
    if (barang.jumlahTersedia < dto.jumlah) {
      throw new BadRequestException(
        `Stok tidak cukup: tersisa ${barang.jumlahTersedia} unit`,
      );
    }

    const tanggalKembali = new Date(dto.tanggalKembali);
    if (tanggalKembali < new Date(new Date().toDateString())) {
      throw new BadRequestException('Tanggal kembali tidak valid');
    }

    const tanggalPinjamStart = dto.tanggalPinjam
      ? new Date(dto.tanggalPinjam)
      : null;
    if (tanggalPinjamStart) {
      const pinjamMid = new Date(
        tanggalPinjamStart.getFullYear(),
        tanggalPinjamStart.getMonth(),
        tanggalPinjamStart.getDate(),
      ).getTime();
      const kembaliMid = new Date(
        tanggalKembali.getFullYear(),
        tanggalKembali.getMonth(),
        tanggalKembali.getDate(),
      ).getTime();
      if (pinjamMid > kembaliMid) {
        throw new BadRequestException(
          'Tanggal pinjam harus lebih awal dari tanggal kembali',
        );
      }
      // Hari yang sama legal selama jam kembali setelah jam pinjam.
      if (
        pinjamMid === kembaliMid &&
        dto.jamPinjam &&
        dto.jamKembali &&
        dto.jamKembali <= dto.jamPinjam
      ) {
        throw new BadRequestException(
          'Jam pengembalian harus setelah jam pinjam',
        );
      }
    }

    return this.prisma.peminjaman.create({
      data: {
        barangId: dto.barangId,
        siswaId: siswa.id,
        jumlah: dto.jumlah,
        tanggalPinjam: tanggalPinjamStart ?? new Date(),
        tanggalKembali,
        jamPinjam: dto.jamPinjam ?? null,
        jamKembali: dto.jamKembali ?? null,
        catatan: dto.catatan ?? null,
      },
      include: { barang: true },
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
      this.prisma.peminjaman.count({ where: { siswaId: siswa.id } }),
      this.prisma.peminjaman.findMany({
        where: { siswaId: siswa.id },
        include: { barang: true },
        orderBy: { tanggalPinjam: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(opts: { status?: string; page?: number; limit?: number }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const where =
      opts.status &&
      ['MENUNGGU', 'DIPINJAM', 'DIKEMBALIKAN', 'DITOLAK'].includes(opts.status)
        ? { status: opts.status as never }
        : {};

    const [total, data] = await this.prisma.$transaction([
      this.prisma.peminjaman.count({ where }),
      this.prisma.peminjaman.findMany({
        where,
        include: {
          barang: true,
          siswa: {
            include: {
              user: { select: { nama: true } },
              kelas: { select: { nama: true } },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { tanggalPinjam: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Admin approve/reject. Approve -> kurangi stok tersedia */
  async review(id: number, dto: ReviewPeminjamanDto) {
    const peminjaman = await this.prisma.peminjaman.findUnique({
      where: { id },
      include: { barang: true },
    });
    if (!peminjaman) throw new NotFoundException('Peminjaman tidak ditemukan');
    if (peminjaman.status !== 'MENUNGGU') {
      throw new BadRequestException('Pengajuan ini sudah direview sebelumnya');
    }

    if (dto.aksi === 'APPROVE') {
      if (peminjaman.barang.jumlahTersedia < peminjaman.jumlah) {
        throw new BadRequestException('Stok barang sudah tidak cukup');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.peminjaman.update({
        where: { id },
        data: {
          status: dto.aksi === 'APPROVE' ? 'DIPINJAM' : 'DITOLAK',
          catatan: dto.catatan ?? peminjaman.catatan,
        },
        include: { barang: true },
      });

      if (dto.aksi === 'APPROVE') {
        await tx.barang.update({
          where: { id: peminjaman.barangId },
          data: { jumlahTersedia: { decrement: peminjaman.jumlah } },
        });
      }
      return updated;
    });
  }

  /** Tandai barang dikembalikan -> stok bertambah lagi */
  async returnItem(id: number) {
    const peminjaman = await this.prisma.peminjaman.findUnique({
      where: { id },
    });
    if (!peminjaman) throw new NotFoundException('Peminjaman tidak ditemukan');
    if (peminjaman.status !== 'DIPINJAM') {
      throw new BadRequestException('Peminjaman ini belum disetujui/sudah selesai');
    }
    return this.doReturn(peminjaman.id, peminjaman.barangId, peminjaman.jumlah);
  }

  /** Siswa mengembalikan pinjamannya sendiri (harus miliknya + DIPINJAM). */
  async returnMandiri(id: number, siswaUserId: number) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');
    const peminjaman = await this.prisma.peminjaman.findUnique({
      where: { id },
    });
    if (!peminjaman || peminjaman.siswaId !== siswa.id) {
      throw new NotFoundException('Peminjaman tidak ditemukan');
    }
    if (peminjaman.status !== 'DIPINJAM') {
      throw new BadRequestException('Peminjaman ini belum disetujui/sudah selesai');
    }
    return this.doReturn(peminjaman.id, peminjaman.barangId, peminjaman.jumlah);
  }

  private async doReturn(id: number, barangId: number, jumlah: number) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.peminjaman.update({
        where: { id },
        data: { status: 'DIKEMBALIKAN', dikembalikanAt: new Date() },
        include: { barang: true },
      });
      await tx.barang.update({
        where: { id: barangId },
        data: { jumlahTersedia: { increment: jumlah } },
      });
      return updated;
    });
  }
}
