import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMapelDto {
  @IsString()
  @IsNotEmpty({ message: 'nama mapel wajib diisi' })
  nama: string;

  @IsString()
  @IsNotEmpty({ message: 'kode mapel wajib diisi' })
  kode: string;
}

export class UpdateMapelDto {
  @IsOptional() @IsString() nama?: string;
  @IsOptional() @IsString() kode?: string;
}
