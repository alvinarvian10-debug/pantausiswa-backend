import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKelasDto {
  @IsString()
  @IsNotEmpty({ message: 'nama kelas wajib diisi' })
  nama: string;

  @IsString()
  @IsNotEmpty({ message: 'tingkat wajib diisi' })
  tingkat: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  waliId?: number;
}

export class UpdateKelasDto {
  @IsOptional() @IsString() nama?: string;
  @IsOptional() @IsString() tingkat?: string;
  @IsOptional() @Type(() => Number) @IsInt() waliId?: number | null;
}
