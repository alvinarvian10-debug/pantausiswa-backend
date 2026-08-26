import {
  Body,
  Controller,
  Delete,
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
import { TugasService } from './tugas.service';
import {
  CreateSubmissionDto,
  CreateTugasDto,
  NilaiSubmissionDto,
  UpdateTugasDto,
} from './dto';

export class QueryTugasDto {
  @IsOptional() @Type(() => Number) @IsInt() kelasId?: number;
}

@Controller('tugas')
export class TugasController {
  constructor(private readonly service: TugasService) {}

  @Post()
  @Roles(Role.GURU)
  create(@CurrentUser('userId') userId: number, @Body() dto: CreateTugasDto) {
    return this.service.create(userId, dto);
  }

  /** Semua tugas (guru lihat miliknya, admin lihat semua) */
  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  findAll(
    @CurrentUser() user: { userId: number; role: string },
    @Query() query: QueryTugasDto,
  ) {
    return this.service.findAll({
      kelasId: query.kelasId,
      guruUserId: user.role === 'GURU' ? user.userId : undefined,
    });
  }

  /** Tugas untuk siswa sesuai kelasnya */
  @Get('saya')
  @Roles(Role.SISWA)
  findMine(@CurrentUser('userId') userId: number) {
    return this.service.findForSiswa(userId);
  }

  /** Riwayat nilai siswa */
  @Get('nilai-saya')
  @Roles(Role.SISWA)
  myGrades(@CurrentUser('userId') userId: number) {
    return this.service.myGrades(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.GURU, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateTugasDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.service.remove(id, userId);
  }

  /** Siswa kumpulkan jawaban */
  @Post(':id/submissions')
  @Roles(Role.SISWA)
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.service.submit(id, userId, dto);
  }

  /** Guru lihat pengumpulan */
  @Get(':id/submissions')
  @Roles(Role.GURU, Role.ADMIN)
  getSubmissions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.service.getSubmissions(id, userId);
  }

  /** Guru nilai submission */
  @Patch('submissions/:subId/nilai')
  @Roles(Role.GURU, Role.ADMIN)
  grade(
    @Param('subId', ParseIntPipe) subId: number,
    @CurrentUser('userId') userId: number,
    @Body() dto: NilaiSubmissionDto,
  ) {
    return this.service.grade(subId, userId, dto);
  }
}
