import { IsArray, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsString, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { Express } from 'express';

export class ReweightPieceItemDto {
    @IsNumber({}, { message: 'Piece ID harus berupa angka' })
    piece_id: number;

    @IsNumber({}, { message: 'Berat harus berupa angka' })
    berat: number;

    @IsNumber({}, { message: 'Panjang harus berupa angka' })
    panjang: number;

    @IsNumber({}, { message: 'Lebar harus berupa angka' })
    lebar: number;

    @IsNumber({}, { message: 'Tinggi harus berupa angka' })
    tinggi: number;
}

export class ReweightBulkActionDto {
    @IsString({ message: 'Action harus berupa string' })
    @IsIn(['update', 'delete', 'add'], { message: 'Action harus berupa update, delete, atau add' })
    action: 'update' | 'delete' | 'add';

    // Order ID wajib untuk action 'add', optional untuk 'update' dan 'delete'
    @IsOptional()
    @IsNumber({}, { message: 'Order ID harus berupa angka' })
    order_id?: number;

    // Piece ID hanya wajib untuk update dan delete
    @IsOptional()
    @IsNumber({}, { message: 'Piece ID harus berupa angka' })
    piece_id?: number;

    // Untuk action 'update' dan 'add'
    @IsOptional()
    @IsNumber({}, { message: 'Berat harus berupa angka' })
    berat?: number;

    @IsOptional()
    @IsNumber({}, { message: 'Panjang harus berupa angka' })
    panjang?: number;

    @IsOptional()
    @IsNumber({}, { message: 'Lebar harus berupa angka' })
    lebar?: number;

    @IsOptional()
    @IsNumber({}, { message: 'Tinggi harus berupa angka' })
    tinggi?: number;
}

export class ReweightBulkDto {
    @IsArray({ message: 'Actions harus berupa array' })
    @ValidateNested({ each: true })
    @Type(() => ReweightBulkActionDto)
    actions: ReweightBulkActionDto[];

    reweight_by_user_id: number;

    @IsOptional()
    images?: Express.Multer.File[];
}
