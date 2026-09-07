import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePeminjamanDto {
  @Type(() => Number)
  @IsInt({ message: 'barangId tidak valid' })
  barangId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'jumlah minimal 1' })
  jumlah: number;

  @IsDateString({}, { message: 'tanggal kembali tidak valid' })
  tanggalKembali: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class ReviewPeminjamanDto {
  @IsNotEmpty({ message: 'aksi harus APPROVE atau REJECT' })
  aksi: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  catatan?: string;
}
