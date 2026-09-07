import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Email atau password salah');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Email atau password salah');

    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, nama: user.nama, role: user.role },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  /** Admin mengganti password akun lain (mis. menyetujui request sekretaris). */
  async adminSetPassword(dto: { email?: string; userId?: number; newPassword: string }) {
    if (!dto.email && !dto.userId) {
      throw new BadRequestException('email atau userId wajib diisi');
    }
    const user = dto.userId
      ? await this.prisma.user.findUnique({ where: { id: dto.userId } })
      : await this.prisma.user.findUnique({ where: { email: dto.email! } });
    if (!user) throw new NotFoundException('Akun tidak ditemukan');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: `Password ${user.email} berhasil diperbarui` };
  }
}
