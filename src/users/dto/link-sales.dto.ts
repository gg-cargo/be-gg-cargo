import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LinkSalesDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode referral sales tidak boleh kosong' })
  @MaxLength(25, { message: 'Kode referral sales maksimal 25 karakter' })
  kode_referral_sales: string;
}

