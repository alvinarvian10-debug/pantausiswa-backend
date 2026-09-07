import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePasswordRequestDto {
  @IsString()
  @MinLength(6, { message: 'password baru minimal 6 karakter' })
  newPassword: string;
}

export class ReviewPasswordRequestDto {
  @IsNotEmpty({ message: 'aksi harus APPROVE atau REJECT' })
  aksi: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  catatan?: string;
}
