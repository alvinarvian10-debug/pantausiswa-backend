import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ImportSiswaRowDto {
  // IsNotEmpty: cegah nama kosong/blank masuk DB (root cause nama blank).
  @IsString()
  @IsNotEmpty({ message: 'nama wajib diisi' })
  nama: string;

  @IsString()
  @IsNotEmpty({ message: 'nis wajib diisi' })
  nis: string;

  @IsOptional()
  @IsString()
  kelasNama?: string;
}

export class ImportSiswaDto {
  @IsArray()
  @ArrayMaxSize(500, { message: 'maksimal 500 baris per impor' })
  @ValidateNested({ each: true })
  @Type(() => ImportSiswaRowDto)
  rows: ImportSiswaRowDto[];
}

export class ImportGuruRowDto {
  @IsString()
  @IsNotEmpty({ message: 'nama wajib diisi' })
  nama: string;

  @IsOptional()
  @IsString({ each: true })
  mapel?: string[];

  @IsOptional()
  @IsString()
  waliKelasNama?: string | null;
}

export class ImportGuruDto {
  @IsArray()
  @ArrayMaxSize(500, { message: 'maksimal 500 baris per impor' })
  @ValidateNested({ each: true })
  @Type(() => ImportGuruRowDto)
  rows: ImportGuruRowDto[];
}
