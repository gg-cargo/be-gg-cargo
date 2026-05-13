import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class RegisterCustomerCompanyAccountDto {
    @IsString({ message: 'Nama PIC harus berupa string' })
    @IsNotEmpty({ message: 'Nama PIC tidak boleh kosong' })
    pic_name: string;

    @IsEmail({}, { message: 'Format email PIC tidak valid' })
    email: string;

    @IsString({ message: 'Nomor telepon PIC harus berupa string' })
    @IsNotEmpty({ message: 'Nomor telepon PIC tidak boleh kosong' })
    phone: string;

    @IsString({ message: 'Password harus berupa string' })
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    password: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'level harus berupa angka' })
    level?: number;
}

export class RegisterCustomerCompanyDataDto {
    @IsString({ message: 'Nama perusahaan harus berupa string' })
    @IsNotEmpty({ message: 'Nama perusahaan tidak boleh kosong' })
    company_name: string;

    @IsOptional()
    @IsString({ message: 'Nama legal perusahaan harus berupa string' })
    legal_name?: string;

    @IsEmail({}, { message: 'Format email perusahaan tidak valid' })
    company_email: string;

    @IsString({ message: 'Nomor telepon perusahaan harus berupa string' })
    @IsNotEmpty({ message: 'Nomor telepon perusahaan tidak boleh kosong' })
    company_phone: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'payment_terms_days harus berupa angka' })
    payment_terms_days?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'discount_rate harus berupa angka' })
    discount_rate?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'credit_limit harus berupa angka' })
    credit_limit?: number;
}

export class RegisterCustomerCompanyAddressDto {
    @IsOptional()
    @IsString({ message: 'Label alamat harus berupa string' })
    label?: string;

    @IsOptional()
    @IsString({ message: 'Nama kontak harus berupa string' })
    contact_name?: string;

    @IsOptional()
    @IsString({ message: 'Telepon kontak harus berupa string' })
    contact_phone?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email kontak tidak valid' })
    contact_email?: string;

    @IsString({ message: 'Alamat harus berupa string' })
    @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
    address: string;

    @IsOptional()
    @IsString({ message: 'Provinsi harus berupa string' })
    province?: string;

    @IsOptional()
    @IsString({ message: 'Kota harus berupa string' })
    city?: string;

    @IsOptional()
    @IsString({ message: 'Kecamatan harus berupa string' })
    district?: string;

    @IsOptional()
    @IsString({ message: 'Kelurahan harus berupa string' })
    subdistrict?: string;

    @IsOptional()
    @IsString({ message: 'Kode pos harus berupa string' })
    postal_code?: string;

    @IsString({ message: 'Lokasi harus berupa string' })
    @IsNotEmpty({ message: 'Lokasi tidak boleh kosong' })
    location_text: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Latitude harus berupa angka' })
    lat?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Longitude harus berupa angka' })
    lng?: number;
}

export class RegisterCustomerCompanyDocumentDto {
    @IsString({ message: 'Tipe dokumen harus berupa string' })
    @IsIn(['nib', 'siup', 'nib_siup', 'npwp', 'akta', 'other'], {
        message: 'document_type tidak valid',
    })
    document_type: string;

    @IsOptional()
    @IsString({ message: 'Nomor dokumen harus berupa string' })
    document_number?: string;

    @Type(() => Number)
    @IsNumber({}, { message: 'file_log_id harus berupa angka' })
    file_log_id: number;
}

export class RegisterCustomerCompanyDto {
    @ValidateNested()
    @Type(() => RegisterCustomerCompanyAccountDto)
    account: RegisterCustomerCompanyAccountDto;

    @ValidateNested()
    @Type(() => RegisterCustomerCompanyDataDto)
    company: RegisterCustomerCompanyDataDto;

    @ValidateNested()
    @Type(() => RegisterCustomerCompanyAddressDto)
    address: RegisterCustomerCompanyAddressDto;

    @IsArray({ message: 'documents harus berupa array' })
    @ArrayMinSize(1, { message: 'documents minimal 1 item' })
    @ValidateNested({ each: true })
    @Type(() => RegisterCustomerCompanyDocumentDto)
    documents: RegisterCustomerCompanyDocumentDto[];

    @IsOptional()
    @IsString({ message: 'kode_referral_sales harus berupa string' })
    kode_referral_sales?: string;
}
