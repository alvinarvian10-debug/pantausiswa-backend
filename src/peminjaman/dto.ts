import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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

  // Pre-order: start date boleh hari ini atau masa depan (datetime-local).
  @IsOptional()
  @IsDateString({}, { message: 'tanggal pinjam tidak valid' })
  tanggalPinjam?: string;

  @IsDateString({}, { message: 'tanggal kembali tidak valid' })
  tanggalKembali: string;

  // Opsional HH:MM untuk UI berbasis jam terpisah (kompatibel date-only).
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'jamPinjam format HH:MM' })
  jamPinjam?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'jamKembali format HH:MM' })
  jamKembali?: string;

  @IsOptional()
  @IsString()
  catatan?: string;

  // Task 3: alasan peminjaman + bukti (URL/file path). Opsional di API
  // agar klien lama tetap kompatibel; UI student mewajibkan alasan.
  @IsOptional()
  @IsString()
  alasan?: string;

  @IsOptional()
  @IsString()
  bukti?: string;
}

export class ReviewPeminjamanDto {
  @IsNotEmpty({ message: 'aksi harus APPROVE atau REJECT' })
  aksi: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  catatan?: string;
}
