import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUsersBankDto {
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'code_bank maksimal 50 karakter' })
  code_bank?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'nama_bank maksimal 50 karakter' })
  nama_bank?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'nama_pemilik_rekening maksimal 200 karakter' })
  nama_pemilik_rekening?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'nomor_rekening maksimal 50 karakter' })
  nomor_rekening?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
