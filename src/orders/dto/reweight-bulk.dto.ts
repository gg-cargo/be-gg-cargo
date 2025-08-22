import { IsArray, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { File } from 'multer';

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

export class ReweightBulkDto {
    pieces: ReweightPieceItemDto[];
    reweight_by_user_id: number;

    @IsOptional()
    images?: File[];
}
