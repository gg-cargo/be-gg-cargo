import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ResolveMissingItemDto {
    @IsString()
    piece_id: string;

    @IsNumber()
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value, 10))
    found_at_hub_id: number;

    @IsString()
    @MaxLength(500, { message: 'Catatan terlalu panjang, maksimal 500 karakter' })
    notes_on_finding: string;

    @IsOptional()
    @IsString()
    photo_file?: string; // Path file yang diupload

    @IsNumber()
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value, 10))
    resolved_by_user_id: number;
}

// DTO untuk multipart form data
export class ResolveMissingItemFormDto {
    @IsString()
    piece_id: string;

    @IsNumber()
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value, 10))
    found_at_hub_id: number;

    @IsString()
    @MaxLength(500, { message: 'Catatan terlalu panjang, maksimal 500 karakter' })
    notes_on_finding: string;

    @IsNumber()
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value, 10))
    resolved_by_user_id: number;
}

