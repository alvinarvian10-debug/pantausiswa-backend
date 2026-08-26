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
import { PeminjamanService } from './peminjaman.service';
import { CreatePeminjamanDto, ReviewPeminjamanDto } from './dto';

export class QueryListDto {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @IsOptional() status?: string;
}

@Controller('peminjaman')
export class PeminjamanController {
  constructor(private readonly service: PeminjamanService) {}

  /** Siswa ajukan pinjam */
  @Post()
  @Roles(Role.SISWA)
  create(@CurrentUser('userId') userId: number, @Body() dto: CreatePeminjamanDto) {
    return this.service.create(userId, dto);
  }

  /** Riwayat milik siswa */
  @Get('me')
  @Roles(Role.SISWA)
  myHistory(@CurrentUser('userId') userId: number, @Query() q: QueryListDto) {
    return this.service.myHistory(userId, q);
  }

  /** Semua peminjaman (admin) */
  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: QueryListDto) {
    return this.service.findAll(query);
  }

  /** Admin approve/reject */
  @Patch(':id/review')
  @Roles(Role.ADMIN)
  review(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewPeminjamanDto) {
    return this.service.review(id, dto);
  }

  /** Admin tandai sudah dikembalikan */
  @Patch(':id/kembalikan')
  @Roles(Role.ADMIN)
  kembalikan(@Param('id', ParseIntPipe) id: number) {
    return this.service.returnItem(id);
  }
}
