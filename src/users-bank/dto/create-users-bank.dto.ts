import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUsersBankDto {
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'code_bank maksimal 50 karakter' })
  code_bank?: string;

  @IsString()
  @IsNotEmpty({ message: 'nama_bank wajib diisi' })
  @MaxLength(50, { message: 'nama_bank maksimal 50 karakter' })
  nama_bank: string;

  @IsString()
  @IsNotEmpty({ message: 'nama_pemilik_rekening wajib diisi' })
  @MaxLength(200, { message: 'nama_pemilik_rekening maksimal 200 karakter' })
  nama_pemilik_rekening: string;

  @IsString()
  @IsNotEmpty({ message: 'nomor_rekening wajib diisi' })
  @MaxLength(50, { message: 'nomor_rekening maksimal 50 karakter' })
  nomor_rekening: string;

  @IsString()
  @IsOptional()
  image?: string;
}
