import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsBoolean, IsUrl, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum TipePengiriman {
    BARANG = 'Barang',
    DOKUMEN = 'Dokumen'
}

export enum JenisPengirimPenerima {
    PERSONAL = 'Personal',
    PERUSAHAAN = 'Perusahaan'
}

export enum LayananInternasional {
    REGULER = 'Reguler'
}

export enum MataUang {
    USD = 'USD',
    EUR = 'EUR',
    IDR = 'IDR'
}

export class PieceDto {
    @IsNumber()
    @Min(1)
    qty: number;

    @IsNumber()
    @Min(0.1)
    berat: number;

    @IsNumber()
    @Min(1)
    panjang: number;

    @IsNumber()
    @Min(1)
    lebar: number;

    @IsNumber()
    @Min(1)
    tinggi: number;
}

export class CreateInternationalOrderDto {
    @IsEnum(TipePengiriman)
    @IsNotEmpty()
    tipe_pengiriman: TipePengiriman;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nama_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    alamat_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    provinsi_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    kota_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    kecamatan_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    kelurahan_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    kodepos_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    no_telepon_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    email_pengirim: string;

    @IsEnum(JenisPengirimPenerima)
    @IsNotEmpty()
    jenis_pengirim: JenisPengirimPenerima;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    negara_pengirim: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    peb_number?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nama_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    alamat_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    provinsi_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    kota_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    kecamatan_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    kelurahan_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    kodepos_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    no_telepon_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    email_penerima: string;

    @IsEnum(JenisPengirimPenerima)
    @IsNotEmpty()
    jenis_penerima: JenisPengirimPenerima;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    negara_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    kodepos_internasional: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nama_barang: string;

    @IsEnum(LayananInternasional)
    @IsNotEmpty()
    layanan: LayananInternasional;

    @IsBoolean()
    asuransi: boolean;

    @IsBoolean()
    packing: boolean;

    @IsNumber()
    @Min(0)
    harga_barang: number;

    @IsEnum(MataUang)
    @IsOptional()
    mata_uang: MataUang;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    hs_code?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    country_of_origin?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    no_referensi?: string;

    @IsNumber()
    @Min(0)
    total_item_value_usd: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    customs_notes?: string;

    @IsOptional()
    @IsUrl()
    commercial_invoice?: string;

    @IsOptional()
    @IsUrl()
    packing_list?: string;

    @IsOptional()
    @IsUrl()
    certificate_of_origin?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PieceDto)
    pieces: PieceDto[];

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
