import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.module';
import { CreateSiswaDto, UpdateSiswaDto } from './dto';

@Injectable()
export class SiswaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSiswaDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email sudah terdaftar');

    const nisExists = await this.prisma.siswa.findUnique({
      where: { nis: dto.nis },
    });
    if (nisExists) throw new ConflictException('NIS sudah terdaftar');

    const hashed = await bcrypt.hash(dto.password, 10);
    const { kelasId, nis, jenisKelamin, tanggalLahir, alamat, noHp, waliMurid } =
      dto;

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        nama: dto.nama,
        role: 'SISWA',
        siswa: {
          create: {
            nis,
            kelasId: kelasId ?? null,
            jenisKelamin: jenisKelamin ?? null,
            tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
            alamat: alamat ?? null,
            noHp: noHp ?? null,
            waliMurid: waliMurid ?? null,
          },
        },
      },
      include: { siswa: true },
    });
  }

  async findAll(opts: { page?: number; limit?: number; search?: string; kelasId?: number }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const where = {
      role: 'SISWA' as const,
      AND: [
        opts.search
          ? {
              OR: [
                { nama: { contains: opts.search } },
                { siswa: { nis: { contains: opts.search } } },
              ],
            }
          : {},
        opts.kelasId ? { siswa: { kelasId: opts.kelasId } } : {},
      ],
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { siswa: { include: { kelas: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((u) => ({
        id: u.siswa?.id,
        userId: u.id,
        nama: u.nama,
        email: u.email,
        ...u.siswa,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nama: true, email: true, role: true } },
        kelas: true,
      },
    });
    if (!siswa) throw new NotFoundException('Data siswa tidak ditemukan');
    return siswa;
  }

  async update(id: number, dto: UpdateSiswaDto) {
    const siswa = await this.prisma.siswa.findUnique({ where: { id } });
    if (!siswa) throw new NotFoundException('Data siswa tidak ditemukan');

    const { kelasId, jenisKelamin, tanggalLahir, alamat, noHp, waliMurid, nis, ...userFields } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({ where: { id: siswa.userId }, data: userFields });
      }
      const siswaData: Record<string, unknown> = {};
      if (nis !== undefined) siswaData.nis = nis;
      if (kelasId !== undefined) siswaData.kelasId = kelasId;
      if (jenisKelamin !== undefined) siswaData.jenisKelamin = jenisKelamin;
      if (tanggalLahir !== undefined) siswaData.tanggalLahir = new Date(tanggalLahir);
      if (alamat !== undefined) siswaData.alamat = alamat;
      if (noHp !== undefined) siswaData.noHp = noHp;
      if (waliMurid !== undefined) siswaData.waliMurid = waliMurid;
      if (Object.keys(siswaData).length > 0) {
        await tx.siswa.update({ where: { id }, data: siswaData });
      }
      return tx.siswa.findUnique({
        where: { id },
        include: { user: { select: { id: true, nama: true, email: true } }, kelas: true },
      });
    });
  }

  async remove(id: number) {
    const siswa = await this.prisma.siswa.findUnique({ where: { id } });
    if (!siswa) throw new NotFoundException('Data siswa tidak ditemukan');
    await this.prisma.user.delete({ where: { id: siswa.userId } });
    return { message: 'Data siswa berhasil dihapus' };
  }
}
