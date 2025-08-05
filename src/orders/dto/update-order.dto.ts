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

    // Required field for audit trail
    @IsNumber()
    @Type(() => Number)
    updated_by_user_id: number;
} 