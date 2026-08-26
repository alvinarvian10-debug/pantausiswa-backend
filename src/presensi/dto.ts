import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateString, IsInt } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsString()
  catatan?: string;
}

export class QueryPresensiDto {
  @IsOptional() @Type(() => Number) @IsInt() kelasId?: number;
  @IsOptional() @IsDateString() tanggal?: string;
}
