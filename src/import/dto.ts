import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ImportSiswaRowDto {
  @IsString()
  nama: string;

  @IsString()
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
