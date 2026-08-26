import { IsIn, IsInt, IsNotEmpty, IsOptional, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBarangDto {
  @IsString()
  @IsNotEmpty({ message: 'nama barang wajib diisi' })
  nama: string;

  @IsString()
  @IsNotEmpty({ message: 'kode barang wajib diisi' })
  kode: string;

  @IsString()
  @IsNotEmpty({ message: 'kategori wajib diisi' })
  kategori: string;

  @IsOptional()
  @IsIn(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'])
  kondisi?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  jumlahTotal: number;

  @IsOptional() @IsString() lokasi?: string;
  @IsOptional() @IsString() fotoUrl?: string;
}

export class UpdateBarangDto {
  @IsOptional() @IsString() nama?: string;
  @IsOptional() @IsString() kode?: string;
  @IsOptional() @IsString() kategori?: string;
  @IsOptional() @IsIn(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT']) kondisi?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) jumlahTotal?: number;
  @IsOptional() @IsString() lokasi?: string;
  @IsOptional() @IsString() fotoUrl?: string;
}
