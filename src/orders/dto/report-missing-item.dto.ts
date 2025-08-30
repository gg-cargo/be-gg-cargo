import { IsArray, IsString, IsNumber, ArrayMinSize, ArrayMaxSize, MaxLength } from 'class-validator';

export class ReportMissingItemDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Minimal harus ada 1 piece yang dilaporkan hilang' })
    @ArrayMaxSize(50, { message: 'Maksimal 50 piece yang dapat dilaporkan sekaligus' })
    @IsString({ each: true, message: 'Setiap piece ID harus berupa string' })
    missing_piece_ids: string[];

    @IsString()
    @MaxLength(500, { message: 'Pesan terlalu panjang, maksimal 500 karakter' })
    message: string;

    @IsNumber()
    reported_by_user_id: number;
}

