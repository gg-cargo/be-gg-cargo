import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsNumber, IsOptional, IsArray, ValidateNested, IsPositive, IsDate, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// Ekonomi', 'Reguler', 'Kirim Motor', 'Paket', 'Express', 'Sewa Truk
export enum LayananType {
    EKONOMI = 'Ekonomi',
    REGULER = 'Reguler',
    PAKET = 'Paket',
    EXPRESS = 'Express',
    SEWA_TRUK = 'Sewa Truk',
    KIRIM_MOTOR = 'Kirim Motor'
}

export class CreateOrderPieceDto {

    @IsNumber()
    @IsPositive()
    qty: number;

    @IsNumber()
    @IsPositive()
    berat: number;

    @IsNumber()
    @IsPositive()
    panjang: number;

    @IsNumber()
    @IsPositive()
    lebar: number;

    @IsNumber()
    @IsPositive()
    tinggi: number;
}

export class CreateOrderDto {
    // Data pengirim
    @IsString() @IsNotEmpty() nama_pengirim: string;
    @IsString() @IsNotEmpty() alamat_pengirim: string;
    @IsString() @IsNotEmpty() provinsi_pengirim: string;
    @IsString() @IsNotEmpty() kota_pengirim: string;
    @IsString() @IsNotEmpty() kecamatan_pengirim: string;
    @IsString() @IsNotEmpty() kelurahan_pengirim: string;
    @IsString() @IsNotEmpty() kodepos_pengirim: string;
    @IsString() @IsNotEmpty() no_telepon_pengirim: string;
    @IsString() @IsOptional() email_pengirim: string;

    // Data penerima
    @IsString() @IsNotEmpty() nama_penerima: string;
    @IsString() @IsNotEmpty() alamat_penerima: string;
    @IsString() @IsNotEmpty() provinsi_penerima: string;
    @IsString() @IsNotEmpty() kota_penerima: string;
    @IsString() @IsNotEmpty() kecamatan_penerima: string;
    @IsString() @IsNotEmpty() kelurahan_penerima: string;
    @IsString() @IsNotEmpty() kodepos_penerima: string;
    @IsString() @IsNotEmpty() no_telepon_penerima: string;
    @IsString() @IsOptional() email_penerima: string;

    // Layanan dan asuransi
    @IsEnum(LayananType)
    layanan: LayananType;

    @IsNumber()
    @IsOptional()
    asuransi?: number;

    @IsNumber()
    @IsOptional()
    packing?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    harga_barang?: number;

    @IsString()
    @IsOptional()
    nama_barang?: string;

    @IsString()
    @IsOptional()
    no_referensi?: string;

    // surat jalan balik
    @IsString()
    @IsOptional()
    isSuratJalanBalik?: string;

    @IsString()
    @IsOptional()
    surat_jalan_balik?: string;

    @IsString()
    @IsOptional()
    SJLocation?: string;

    @IsString()
    @IsOptional()
    SJLatlng?: string;

    // surat jalan
    @IsString()
    @IsOptional()
    SJName?: string;

    //pickup_time, date
    @IsDateString()
    @IsOptional()
    pickup_time?: Date;

    // surat jalan no telepon
    @IsString()
    @IsOptional()
    SJPhone?: string;

    // surat jalan alamat
    @IsString()
    @IsOptional()
    SJAddress?: string;

    // surat jalan kota
    @IsString()
    @IsOptional()
    SJCity?: string;

    // invoice
    @IsString()
    @IsOptional()
    billing_name?: string;
    @IsString()
    @IsOptional()
    billing_phone?: string;
    @IsString()
    @IsOptional()
    billing_email?: string;
    @IsString()
    @IsOptional()
    billing_address?: string;

    // provinsi
    @IsString()
    @IsOptional()
    SJProvince?: string;

    // dokumen po
    @IsString()
    @IsOptional()
    dokumen_po?: string;

    // Detail paket/koli
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderPieceDto)
    pieces: CreateOrderPieceDto[];
} 