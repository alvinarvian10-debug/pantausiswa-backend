import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

import { Public, Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';

export class LoginDto {
  @IsEmail({}, { message: 'format email tidak valid' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password wajib diisi' })
  password: string;
}

export class AdminSetPasswordDto {
  @IsOptional()
  @IsEmail({}, { message: 'format email tidak valid' })
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsString()
  @MinLength(6, { message: 'password baru minimal 6 karakter' })
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  me(@CurrentUser('userId') userId: number) {
    return this.authService.getProfile(userId);
  }

  /** Admin mengganti password akun lain langsung. */
  @Post('admin-set-password')
  @Roles(Role.ADMIN)
  adminSetPassword(@Body() dto: AdminSetPasswordDto) {
    return this.authService.adminSetPassword(dto);
  }
}
