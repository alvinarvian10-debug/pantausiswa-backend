import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { CreateBarangDto, UpdateBarangDto } from './dto';

@Injectable()
export class InventarisService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBarangDto) {
    return this.prisma.barang.create({
      data: {
        nama: dto.nama,
        kode: dto.kode,
        kategori: dto.kategori,
        kondisi: (dto.kondisi as never) ?? 'BAIK',
        jumlahTotal: dto.jumlahTotal,
        jumlahTersedia: dto.jumlahTotal,
        lokasi: dto.lokasi ?? null,
        fotoUrl: dto.fotoUrl ?? null,
      },
    });
  }

  async findAll(opts: { search?: string; kategori?: string }) {
    const where: Record<string, unknown> = {};
    if (opts.search) where.nama = { contains: opts.search };
    if (opts.kategori) where.kategori = opts.kategori;

    return this.prisma.barang.findMany({
      where,
      orderBy: { nama: 'asc' },
    });
  }

  async findOne(id: number) {
    const barang = await this.prisma.barang.findUnique({
      where: { id },
      include: {
        peminjaman: {
          include: {
            siswa: { include: { user: { select: { nama: true } } } },
          },
          orderBy: { tanggalPinjam: 'desc' },
          take: 10,
        },
      },
    });
    if (!barang) throw new NotFoundException('Barang tidak ditemukan');
    return barang;
  }

  async update(id: number, dto: UpdateBarangDto) {
    const barang = await this.prisma.barang.findUnique({ where: { id } });
    if (!barang) throw new NotFoundException('Barang tidak ditemukan');

    const data: Record<string, unknown> = {};
    for (const key of ['nama', 'kode', 'kategori', 'lokasi', 'fotoUrl'] as const) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (dto.kondisi !== undefined) data.kondisi = dto.kondisi;
    if (dto.jumlahTotal !== undefined) {
      const dipinjam = barang.jumlahTotal - barang.jumlahTersedia;
      if (dto.jumlahTotal < dipinjam) {
        throw new NotFoundException(
          `Tidak bisa: sedang ada ${dipinjam} unit yang dipinjam`,
        );
      }
      data.jumlahTotal = dto.jumlahTotal;
      data.jumlahTersedia = dto.jumlahTotal - dipinjam;
    }

    return this.prisma.barang.update({ where: { id }, data });
  }

  async remove(id: number) {
    const barang = await this.prisma.barang.findUnique({ where: { id } });
    if (!barang) throw new NotFoundException('Barang tidak ditemukan');
    await this.prisma.barang.delete({ where: { id } });
    return { message: 'Barang berhasil dihapus' };
  }
}
