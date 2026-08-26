import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';

export class LoginDto {
  @IsEmail({}, { message: 'format email tidak valid' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password wajib diisi' })
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  me(@CurrentUser('userId') userId: number) {
    return this.authService.getProfile(userId);
  }
}
