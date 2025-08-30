import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';

export class ResolveMissingItemDto {
    @IsString()
    piece_id: string;

    @IsNumber()
    found_at_hub_id: number;

    @IsString()
    @MaxLength(500, { message: 'Catatan terlalu panjang, maksimal 500 karakter' })
    notes_on_finding: string;

    @IsOptional()
    @IsString()
    photo_file?: string; // Path file yang diupload

    @IsNumber()
    resolved_by_user_id: number;
}

// DTO untuk multipart form data
export class ResolveMissingItemFormDto {
    @IsString()
    piece_id: string;

    @IsNumber()
    found_at_hub_id: number;

    @IsString()
    @MaxLength(500, { message: 'Catatan terlalu panjang, maksimal 500 karakter' })
    notes_on_finding: string;

    @IsNumber()
    resolved_by_user_id: number;
}

