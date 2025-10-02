import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ORDER_STATUS_LABELS } from '../../common/constants/order-status.constants';

export class UpdateOrderDto {
    // Order info fields
    @IsOptional()
    @IsString()
    nama_barang?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    harga_barang?: number;

    @IsOptional()
    @IsString()
    @IsIn(ORDER_STATUS_LABELS)
    status?: string;

    @IsOptional()
    @IsString()
    layanan?: string;

    // Shipper fields
    @IsOptional()
    @IsString()
    nama_pengirim?: string;

    @IsOptional()
    @IsString()
    alamat_pengirim?: string;

    @IsOptional()
    @IsString()
    no_telepon_pengirim?: string;

    @IsOptional()
    @IsString()
    email_pengirim?: string;

    @IsOptional()
    @IsString()
    provinsi_pengirim?: string;

    @IsOptional()
    @IsString()
    kota_pengirim?: string;

    @IsOptional()
    @IsString()
    kecamatan_pengirim?: string;

    @IsOptional()
    @IsString()
    kelurahan_pengirim?: string;

    @IsOptional()
    @IsString()
    kodepos_pengirim?: string;

    // Consignee fields
    @IsOptional()
    @IsString()
    nama_penerima?: string;

    @IsOptional()
    @IsString()
    alamat_penerima?: string;

    @IsOptional()
    @IsString()
    no_telepon_penerima?: string;

    @IsOptional()
    @IsString()
    email_penerima?: string;

    @IsOptional()
    @IsString()
    provinsi_penerima?: string;

    @IsOptional()
    @IsString()
    kota_penerima?: string;

    @IsOptional()
    @IsString()
    kecamatan_penerima?: string;

    @IsOptional()
    @IsString()
    kelurahan_penerima?: string;

    @IsOptional()
    @IsString()
    kodepos_penerima?: string;

    // Additional fields from UI
    @IsOptional()
    @IsString()
    titik_kordinat_asal?: string; // latlngAsal

    @IsOptional()
    @Type(() => Date)
    tanggal_muat?: Date; // pickup_time

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    total_jam?: number; // jam_muat -> total_jam

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    total_koli?: number;

    @IsOptional()
    @IsString()
    total_berat?: string; // total_berat is string in model

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    asuransi?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    packing?: number; // packing is number in model

    @IsOptional()
    @IsString()
    surat_jalan_balik?: string;

    @IsOptional()
    @IsString()
    titik_kordinat_tujuan?: string; // latlngTujuan

    @IsOptional()
    @IsString()
    jenis_truck?: string; // truck_type

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    jenis_pembayaran?: number; // metode_bayar_truck

    @IsOptional()
    @IsString()
    transporter?: string; // transporter_id

    // Required field for audit trail
    @IsNumber()
    @Type(() => Number)
    updated_by_user_id: number;
} 