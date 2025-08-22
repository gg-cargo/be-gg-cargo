import { IsNotEmpty, IsNumber, IsString, IsOptional, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class EditReweightPieceItemDto {
    @IsNotEmpty({ message: 'Piece ID tidak boleh kosong' })
    @IsNumber({}, { message: 'Piece ID harus berupa angka' })
    piece_id: number;

    @IsNotEmpty({ message: 'Berat baru tidak boleh kosong' })
    @IsNumber({}, { message: 'Berat harus berupa angka' })
    berat: number;

    @IsNotEmpty({ message: 'Panjang baru tidak boleh kosong' })
    @IsNumber({}, { message: 'Panjang harus berupa angka' })
    panjang: number;

    @IsNotEmpty({ message: 'Lebar baru tidak boleh kosong' })
    @IsNumber({}, { message: 'Lebar harus berupa angka' })
    lebar: number;

    @IsNotEmpty({ message: 'Tinggi baru tidak boleh kosong' })
    @IsNumber({}, { message: 'Tinggi harus berupa angka' })
    tinggi: number;
}

export class EditReweightRequestDto {
    @IsArray({ message: 'Pieces harus berupa array' })
    @ValidateNested({ each: true })
    @Type(() => EditReweightPieceItemDto)
    pieces: EditReweightPieceItemDto[];

    @IsNotEmpty({ message: 'Note tidak boleh kosong' })
    @IsString({ message: 'Note harus berupa string' })
    @MaxLength(35, { message: 'Note maksimal 35 karakter' })
    note: string;

    @IsOptional()
    @IsString({ message: 'Alasan koreksi harus berupa string' })
    alasan_koreksi?: string;
}

export class EditReweightRequestResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        requested_by: string;
        requested_at: string;
        note: string;
        status: string;
        estimated_approval_time: string;
        requests: Array<{
            request_id: number;
            piece_id: number;
            current_data: { berat: number; panjang: number; lebar: number; tinggi: number; };
            new_data: { berat: number; panjang: number; lebar: number; tinggi: number; };
        }>;
    };
}
