import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderPieceUpdateDto {
    @IsString()
    piece_id: string;

    @IsOptional()
    @IsNumber()
    berat?: number;

    @IsOptional()
    @IsNumber()
    panjang?: number;

    @IsOptional()
    @IsNumber()
    lebar?: number;

    @IsOptional()
    @IsNumber()
    tinggi?: number;

    @IsOptional()
    @IsString()
    nama_barang?: string;
}

export class UpdateOrderDto {
    // Order details
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
    nama_penerima?: string;

    @IsOptional()
    @IsString()
    alamat_penerima?: string;

    @IsOptional()
    @IsString()
    no_telepon_penerima?: string;

    @IsOptional()
    @IsString()
    nama_barang?: string;

    @IsOptional()
    @IsString()
    layanan?: string;

    @IsOptional()
    @IsString()
    @IsIn(['Draft', 'Ready for Pickup', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'])
    status?: string;

    @IsOptional()
    @IsNumber()
    total_berat?: number;

    @IsOptional()
    @IsNumber()
    total_harga?: number;

    @IsOptional()
    @IsString()
    catatan?: string;

    // Order pieces updates
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderPieceUpdateDto)
    order_pieces_update?: OrderPieceUpdateDto[];

    // Required field for audit trail
    @IsNumber()
    updated_by_user_id: number;
} 