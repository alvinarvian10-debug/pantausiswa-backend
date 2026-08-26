import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IzinService } from './izin.service';
import { CreateIzinDto, ReviewIzinDto } from './dto';

export class QueryListIzinDto {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @IsOptional() status?: string;
}

@Controller('izin')
export class IzinController {
  constructor(private readonly service: IzinService) {}

  /** Siswa mengajukan izin/sakit/dispensasi */
  @Post()
  @Roles(Role.SISWA)
  create(@CurrentUser('userId') userId: number, @Body() dto: CreateIzinDto) {
    return this.service.create(userId, dto);
  }

  /** Riwayat pengajuan milik siswa */
  @Get('me')
  @Roles(Role.SISWA)
  myHistory(@CurrentUser('userId') userId: number, @Query() q: QueryListIzinDto) {
    return this.service.myHistory(userId, q);
  }

  /** Daftar semua pengajuan (guru/admin), filter by status */
  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  findAll(@Query() query: QueryListIzinDto) {
    return this.service.findAll(query);
  }

  /** Guru approve/reject pengajuan */
  @Patch(':id/review')
  @Roles(Role.GURU, Role.ADMIN)
  review(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') guruUserId: number,
    @Body() dto: ReviewIzinDto,
  ) {
    return this.service.review(id, guruUserId, dto);
  }
}
