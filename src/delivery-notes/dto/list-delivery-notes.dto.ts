import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDeliveryNotesQueryDto {
    @Type(() => Number)
    @IsInt({ message: 'page harus berupa angka' })
    @IsOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsInt({ message: 'limit harus berupa angka' })
    @IsOptional()
    limit?: number = 20;

    @IsOptional()
    @IsString({ message: 'search harus berupa string' })
    search?: string;

    @Type(() => Number)
    @IsInt({ message: 'transporter_id harus berupa angka' })
    @IsOptional()
    transporter_id?: number;

    @IsOptional()
    @IsString({ message: 'tanggal harus berupa string (YYYY-MM-DD)' })
    tanggal?: string;
}

export class DeliveryNoteListItemDto {
    id: number;
    no_delivery_note: string;
    tanggal: string | null;
    transporter_id: number;
    nama_transporter: string | null;
    hub_asal: string | null;
    hub_tujuan: string | null;
    no_polisi: string | null;
    jenis_kendaraan: string | null;
    status: number;
    created_at: string;
}

export class ListDeliveryNotesResponseDto {
    pagination: {
        current_page: number;
        limit: number;
        total_items: number;
        total_pages: number;
    };
    items: DeliveryNoteListItemDto[];
}


