import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { CreateKelasDto, UpdateKelasDto } from './dto';

@Injectable()
export class KelasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateKelasDto) {
    return this.prisma.kelas.create({
      data: { nama: dto.nama, tingkat: dto.tingkat, waliId: dto.waliId ?? null },
      include: {
        wali: { include: { user: { select: { nama: true } } } },
        _count: { select: { siswa: true } },
      },
    });
  }

  async findAll(search?: string) {
    return this.prisma.kelas.findMany({
      where: search ? { nama: { contains: search } } : undefined,
      include: {
        wali: { include: { user: { select: { nama: true } } } },
        _count: { select: { siswa: true } },
      },
      orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }],
    });
  }

  async findOne(id: number) {
    const kelas = await this.prisma.kelas.findUnique({
      where: { id },
      include: {
        wali: { include: { user: { select: { nama: true, email: true } } } },
        siswa: { include: { user: { select: { nama: true, email: true } } } },
      },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');
    return kelas;
  }

  async update(id: number, dto: UpdateKelasDto) {
    const kelas = await this.prisma.kelas.findUnique({ where: { id } });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');

    const data: Record<string, unknown> = {};
    if (dto.nama !== undefined) data.nama = dto.nama;
    if (dto.tingkat !== undefined) data.tingkat = dto.tingkat;
    if (dto.waliId !== undefined) data.waliId = dto.waliId ?? null;

    return this.prisma.kelas.update({
      where: { id },
      data,
      include: { wali: { include: { user: { select: { nama: true } } } } },
    });
  }

  async remove(id: number) {
    const kelas = await this.prisma.kelas.findUnique({
      where: { id },
      include: { _count: { select: { siswa: true } } },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');
    if (kelas._count.siswa > 0) {
      throw new NotFoundException(
        `Tidak bisa dihapus: masih ada ${kelas._count.siswa} siswa di kelas ini`,
      );
    }
    await this.prisma.kelas.delete({ where: { id } });
    return { message: 'Kelas berhasil dihapus' };
  }
}
