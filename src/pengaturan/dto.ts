import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePengaturanDto {
  @IsOptional() @IsString() namaSekolah?: string;
  @IsOptional() @IsString() npsn?: string;
  @IsOptional() @IsString() alamat?: string;
  @IsOptional() @IsString() tahunAjaran?: string;
  @IsOptional() @IsIn(['Ganjil', 'Genap']) semester?: string;
  @IsOptional() @IsString() kepalaSekolah?: string;
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'jamMasuk format HH:MM' })
  jamMasuk?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) batasToleransi?: number;
  @IsOptional() @IsBoolean() notifikasiWA?: boolean;
  @IsOptional() @IsBoolean() notifikasiEmail?: boolean;
}
