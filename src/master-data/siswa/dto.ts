import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSiswaDto {
  @IsEmail({}, { message: 'format email tidak valid' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password wajib diisi' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'nama wajib diisi' })
  nama: string;

  @IsString()
  @IsNotEmpty({ message: 'NIS wajib diisi' })
  nis: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kelasId?: number;

  @IsOptional()
  @IsIn(['L', 'P'])
  jenisKelamin?: string;

  @IsOptional()
  @IsDateString()
  tanggalLahir?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  noHp?: string;

  @IsOptional()
  @IsString()
  waliMurid?: string;
}

export class UpdateSiswaDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() nama?: string;
  @IsOptional() @IsString() nis?: string;
  @IsOptional() @Type(() => Number) @IsInt() kelasId?: number;
  @IsOptional() @IsIn(['L', 'P']) jenisKelamin?: string;
  @IsOptional() @IsDateString() tanggalLahir?: string;
  @IsOptional() @IsString() alamat?: string;
  @IsOptional() @IsString() noHp?: string;
  @IsOptional() @IsString() waliMurid?: string;
}
