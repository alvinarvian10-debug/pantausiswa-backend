import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAduanDto {
  @IsString()
  @IsNotEmpty({ message: 'judul aduan wajib diisi' })
  judul: string;

  @IsString()
  @IsNotEmpty({ message: 'deskripsi wajib diisi' })
  deskripsi: string;

  @IsEnum(['FASILITAS', 'ADMINISTRASI', 'LAINNYA'], {
    message: 'kategori harus FASILITAS, ADMINISTRASI, atau LAINNYA',
  })
  kategori: string;

  @IsOptional()
  @IsEnum(['RENDAH', 'SEDANG', 'TINGGI'])
  prioritas?: string;

  @IsOptional()
  @IsString()
  lampiranUrl?: string;
}

export class UpdateAduanDto {
  @IsOptional()
  @IsEnum(['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK'], {
    message: 'status tidak valid',
  })
  status?: string;

  @IsOptional()
  @IsEnum(['RENDAH', 'SEDANG', 'TINGGI'])
  prioritas?: string;

  @IsOptional()
  @IsString()
  tanggapan?: string;
}
