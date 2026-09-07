import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt } from 'class-validator';
import { StatusPresensi } from '@prisma/client';

export class CheckInDto {
  @IsOptional()
  @IsString()
  catatan?: string;
}

export class QueryPresensiDto {
  @IsOptional() @Type(() => Number) @IsInt() kelasId?: number;
  @IsOptional() @IsDateString() tanggal?: string;
}

export class CatatPresensiDto {
  @Type(() => Number)
  @IsInt()
  siswaId: number;

  @IsOptional()
  @IsDateString({}, { message: 'tanggal tidak valid' })
  tanggal?: string;

  @IsEnum(StatusPresensi, { message: 'status tidak valid' })
  status: StatusPresensi;

  @IsOptional()
  @IsString()
  catatan?: string;
}
