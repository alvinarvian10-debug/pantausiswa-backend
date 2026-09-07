import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
import { ReviewPasswordRequestDto } from './dto';

const includeRequester = {
  requester: {
    select: {
      nama: true,
      email: true,
      sekretaris: { select: { kelas: { select: { nama: true } } } },
    },
  },
} as const;

@Injectable()
export class PasswordRequestService {
  constructor(private prisma: PrismaService) {}

  /** Sekretaris mengajukan password baru (disimpan sebagai hash, bukan plaintext). */
  async create(sekretarisUserId: number, newPassword: string) {
    const sekretaris = await this.prisma.sekretaris.findUnique({
      where: { userId: sekretarisUserId },
    });
    if (!sekretaris) {
      throw new ForbiddenException('Akun ini bukan sekretaris aktif');
    }
    const pending = await this.prisma.passwordRequest.findFirst({
      where: { requesterId: sekretarisUserId, status: 'MENUNGGU' },
    });
    if (pending) {
      throw new BadRequestException(
        'Masih ada permintaan yang menunggu konfirmasi admin',
      );
    }
    const req = await this.prisma.passwordRequest.create({
      data: {
        requesterId: sekretarisUserId,
        passwordHash: await bcrypt.hash(newPassword, 10),
      },
      include: includeRequester,
    });
    return { message: 'Permintaan dikirim, menunggu konfirmasi admin', id: req.id };
  }

  async myRequests(sekretarisUserId: number) {
    return this.prisma.passwordRequest.findMany({
      where: { requesterId: sekretarisUserId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findAll(status?: string) {
    const where =
      status && ['MENUNGGU', 'DISETUJUI', 'DITOLAK'].includes(status)
        ? { status: status as never }
        : {};
    return this.prisma.passwordRequest.findMany({
      where,
      include: includeRequester,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** Admin setujui (password langsung berlaku) atau tolak. */
  async review(id: number, reviewerId: number, dto: ReviewPasswordRequestDto) {
    const req = await this.prisma.passwordRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Permintaan tidak ditemukan');
    if (req.status !== 'MENUNGGU') {
      throw new BadRequestException('Permintaan ini sudah direview sebelumnya');
    }

    if (dto.aksi === 'APPROVE') {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: req.requesterId },
          data: { password: req.passwordHash },
        }),
        this.prisma.passwordRequest.update({
          where: { id },
          data: {
            status: 'DISETUJUI',
            reviewerId,
            reviewedAt: new Date(),
            catatan: dto.catatan ?? null,
          },
        }),
      ]);
      return { message: 'Password baru berlaku untuk akun peminta' };
    }

    return this.prisma.passwordRequest.update({
      where: { id },
      data: {
        status: 'DITOLAK',
        reviewerId,
        reviewedAt: new Date(),
        catatan: dto.catatan ?? null,
      },
    });
  }
}
