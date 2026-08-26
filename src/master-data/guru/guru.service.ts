import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.module';
import { CreateGuruDto, UpdateGuruDto } from './dto';

@Injectable()
export class GuruService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGuruDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email sudah terdaftar');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        nama: dto.nama,
        role: 'GURU',
        guru: {
          create: {
            nip: dto.nip,
            noHp: dto.noHp ?? null,
            jenisKelamin: dto.jenisKelamin ?? null,
            alamat: dto.alamat ?? null,
          },
        },
      },
      include: { guru: true },
    });
  }

  async findAll(opts: { page?: number; limit?: number; search?: string }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit && opts.limit > 0 ? opts.limit : 20, 100);

    const where = {
      role: 'GURU' as const,
      ...(opts.search
        ? {
            OR: [
              { nama: { contains: opts.search } },
              { guru: { nip: { contains: opts.search } } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { guru: { include: { kelasDiampu: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((u) => ({
        id: u.guru?.id,
        userId: u.id,
        nama: u.nama,
        email: u.email,
        ...u.guru,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const guru = await this.prisma.guru.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nama: true, email: true, role: true } },
        kelasDiampu: true,
      },
    });
    if (!guru) throw new NotFoundException('Data guru tidak ditemukan');
    return guru;
  }

  async update(id: number, dto: UpdateGuruDto) {
    const guru = await this.prisma.guru.findUnique({ where: { id } });
    if (!guru) throw new NotFoundException('Data guru tidak ditemukan');

    const { noHp, jenisKelamin, alamat, nip, ...userFields } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({ where: { id: guru.userId }, data: userFields });
      }
      const guruData: Record<string, unknown> = {};
      if (nip !== undefined) guruData.nip = nip;
      if (noHp !== undefined) guruData.noHp = noHp;
      if (jenisKelamin !== undefined) guruData.jenisKelamin = jenisKelamin;
      if (alamat !== undefined) guruData.alamat = alamat;
      if (Object.keys(guruData).length > 0) {
        await tx.guru.update({ where: { id }, data: guruData });
      }
      return tx.guru.findUnique({
        where: { id },
        include: { user: { select: { id: true, nama: true, email: true } }, kelasDiampu: true },
      });
    });
  }

  async remove(id: number) {
    const guru = await this.prisma.guru.findUnique({ where: { id } });
    if (!guru) throw new NotFoundException('Data guru tidak ditemukan');
    await this.prisma.user.delete({ where: { id: guru.userId } });
    return { message: 'Data guru berhasil dihapus' };
  }
}
