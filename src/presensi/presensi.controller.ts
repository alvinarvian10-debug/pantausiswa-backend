import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { PresensiService } from './presensi.service';
import { CatatPresensiDto, CheckInDto, QueryPresensiDto } from './dto';

export class QueryRiwayatDto {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}

@Controller('presensi')
export class PresensiController {
  constructor(private readonly service: PresensiService) {}

  /** Siswa check-in kehadiran hari ini */
  @Post('check-in')
  @Roles(Role.SISWA)
  checkIn(@CurrentUser('userId') userId: number, @Body() dto: CheckInDto) {
    return this.service.checkIn(userId, dto.catatan);
  }

  /** Riwayat kehadiran milik siswa yang login */
  @Get('me')
  @Roles(Role.SISWA)
  myHistory(@CurrentUser('userId') userId: number, @Query() q: QueryRiwayatDto) {
    return this.service.myHistory(userId, q);
  }

  /** Rekap harian untuk guru/admin (bisa filter kelas & tanggal) */
  @Get('rekap')
  @Roles(Role.ADMIN, Role.GURU, Role.SEKRETARIS)
  rekapHarian(
    @CurrentUser() user: RequestUser,
    @Query() query: QueryPresensiDto,
  ) {
    // Sekretaris selalu dibatasi ke kelasnya sendiri (abaikan query kelasId).
    if (user.role === Role.SEKRETARIS) {
      return this.service.rekapSekretaris(user.userId, query.tanggal);
    }
    return this.service.rekapHarian(query);
  }

  /** Pencatatan manual oleh sekretaris (kelasnya sendiri), guru, atau admin */
  @Post('catat')
  @Roles(Role.SEKRETARIS, Role.GURU, Role.ADMIN)
  catat(@CurrentUser() user: RequestUser, @Body() dto: CatatPresensiDto) {
    return this.service.catat(
      { userId: user.userId, role: user.role },
      dto,
    );
  }
}
