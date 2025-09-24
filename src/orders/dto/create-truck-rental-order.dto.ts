import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsDateString, MaxLength, Matches, IsNumber } from 'class-validator';

export enum TruckType {
    CDD = 'CDD box',
    CDDL = 'CDDL box',
    PICKUP = 'Pick Up box',
    FUSO = 'Fuso box',
    CDE = 'CDE box'
}

export enum TollPaymentMethod {
    PARTIAL_PAYMENT = 1, // Pembayaran 70% 30%
    FULL_PAYMENT = 2     // Full Payment/100%
}

export class CreateTruckRentalOrderDto {
    // Data Pengirim
    @IsString()
    @IsNotEmpty()
    nama_pengirim: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(35, { message: 'alamat_pengirim maksimal 35 karakter' })
    alamat_pengirim: string;

    @IsString()
    @IsNotEmpty()
    provinsi_pengirim: string;

    @IsString()
    @IsNotEmpty()
    kota_pengirim: string;

    @IsString()
    @IsNotEmpty()
    kecamatan_pengirim: string;

    @IsString()
    @IsNotEmpty()
    kelurahan_pengirim: string;

    @IsString()
    @IsNotEmpty()
    kodepos_pengirim: string;

    @IsString()
    @IsNotEmpty()
    no_telepon_pengirim: string;

    // Data Penerima
    @IsString()
    @IsNotEmpty()
    nama_penerima: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(35, { message: 'alamat_penerima maksimal 35 karakter' })
    alamat_penerima: string;

    @IsString()
    @IsNotEmpty()
    provinsi_penerima: string;

    @IsString()
    @IsNotEmpty()
    kota_penerima: string;

    @IsString()
    @IsNotEmpty()
    kecamatan_penerima: string;

    @IsString()
    @IsNotEmpty()
    kelurahan_penerima: string;

    @IsString()
    @IsNotEmpty()
    kodepos_penerima: string;

    @IsString()
    @IsNotEmpty()
    no_telepon_penerima: string;

    // Data Pesanan Spesifik Sewa Truk
    @IsString()
    @IsNotEmpty()
    layanan: string; // "Sewa truck"

    @IsString()
    @IsNotEmpty()
    @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
        message: 'Format koordinat tidak valid. Gunakan format: lat,lng (contoh: -6.2088,106.8456)'
    })
    origin_latlng: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
        message: 'Format koordinat tidak valid. Gunakan format: lat,lng (contoh: -7.2575,112.7521)'
    })
    destination_latlng: string;

    @IsBoolean()
    isUseToll: boolean;

    @IsNumber()
    @IsEnum(TollPaymentMethod)
    toll_payment_method: TollPaymentMethod;

    @IsEnum(TruckType)
    truck_type: TruckType;

    @IsDateString()
    @IsNotEmpty()
    pickup_time: string;

    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'keterangan_barang maksimal 100 karakter' })
    keterangan_barang?: string;

    @IsNumber()
    @IsOptional()
    asuransi?: number;
}
