import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTugasDto {
  @IsString()
  @IsNotEmpty({ message: 'judul wajib diisi' })
  judul: string;

  @IsString()
  @IsNotEmpty({ message: 'deskripsi wajib diisi' })
  deskripsi: string;

  @Type(() => Number)
  @IsInt({ message: 'mapelId tidak valid' })
  mapelId: number;

  @Type(() => Number)
  @IsInt({ message: 'kelasId tidak valid' })
  kelasId: number;

  @IsDateString({}, { message: 'tenggat tidak valid' })
  tenggat: string;

  @IsOptional()
  @IsString()
  lampiranUrl?: string;
}

export class UpdateTugasDto {
  @IsOptional() @IsString() judul?: string;
  @IsOptional() @IsString() deskripsi?: string;
  @IsOptional() @Type(() => Number) @IsInt() mapelId?: number;
  @IsOptional() @Type(() => Number) @IsInt() kelasId?: number;
  @IsOptional() @IsDateString() tenggat?: string;
  @IsOptional() @IsString() lampiranUrl?: string;
}

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty({ message: 'link file jawaban wajib diisi' })
  fileUrl: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class NilaiSubmissionDto {
  @Type(() => Number)
  @IsInt({ message: 'nilai harus angka bulat' })
  @Min(0, { message: 'nilai minimal 0' })
  @Max(100, { message: 'nilai maksimal 100' })
  nilai: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
