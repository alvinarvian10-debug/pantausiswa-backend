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

export class CreateGuruDto {
  @IsEmail({}, { message: 'format email tidak valid' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password wajib diisi' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'nama wajib diisi' })
  nama: string;

  @IsString()
  @IsNotEmpty({ message: 'NIP wajib diisi' })
  nip: string;

  @IsOptional() @IsString() noHp?: string;
  @IsOptional() @IsIn(['L', 'P']) jenisKelamin?: string;
  @IsOptional() @IsString() alamat?: string;
}

export class UpdateGuruDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() nama?: string;
  @IsOptional() @IsString() nip?: string;
  @IsOptional() @IsString() noHp?: string;
  @IsOptional() @IsIn(['L', 'P']) jenisKelamin?: string;
  @IsOptional() @IsString() alamat?: string;
}
