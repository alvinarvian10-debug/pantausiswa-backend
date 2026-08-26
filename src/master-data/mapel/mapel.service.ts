import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { CreateMapelDto, UpdateMapelDto } from './dto';

@Injectable()
export class MapelService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMapelDto) {
    return this.prisma.mataPelajaran.create({ data: dto });
  }

  findAll() {
    return this.prisma.mataPelajaran.findMany({
      orderBy: { nama: 'asc' },
      include: { _count: { select: { tugas: true } } },
    });
  }

  async findOne(id: number) {
    const mapel = await this.prisma.mataPelajaran.findUnique({ where: { id } });
    if (!mapel) throw new NotFoundException('Mata pelajaran tidak ditemukan');
    return mapel;
  }

  async update(id: number, dto: UpdateMapelDto) {
    await this.ensureExists(id);
    return this.prisma.mataPelajaran.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.mataPelajaran.delete({ where: { id } });
    return { message: 'Mata pelajaran berhasil dihapus' };
  }

  private async ensureExists(id: number) {
    const mapel = await this.prisma.mataPelajaran.findUnique({ where: { id } });
    if (!mapel) throw new NotFoundException('Mata pelajaran tidak ditemukan');
    return mapel;
  }
}
