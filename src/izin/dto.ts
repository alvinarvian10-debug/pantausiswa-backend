import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusIzin } from '@prisma/client';

export class CreateIzinDto {
  @IsEnum(['IZIN', 'SAKIT', 'DISPENSASI'], {
    message: 'jenis harus IZIN, SAKIT, atau DISPENSASI',
  })
  jenis: string;

  @IsDateString({}, { message: 'tanggal mulai tidak valid' })
  tanggalMulai: string;

  @IsDateString({}, { message: 'tanggal selesai tidak valid' })
  tanggalSelesai: string;

  @IsString()
  @IsNotEmpty({ message: 'keterangan wajib diisi' })
  keterangan: string;

  @IsOptional()
  @IsString()
  lampiranUrl?: string;
}

export class ReviewIzinDto {
  @IsEnum(StatusIzin, { message: 'status harus DISETUJUI atau DITOLAK' })
  status: Exclude<StatusIzin, 'MENUNGGU'>;

  @IsOptional()
  @IsString()
  catatanReview?: string;
}

export class QueryIzinDto {
  @IsOptional()
  @IsEnum(StatusIzin)
  status?: StatusIzin;
}
