import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListTruckRentalDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status_pengiriman?: string;

    @IsOptional()
    @IsString()
    status_pembayaran?: string;

    @IsOptional()
    @IsString()
    date_from?: string;

    @IsOptional()
    @IsString()
    date_to?: string;

    @IsOptional()
    @IsString()
    sort_by?: string = 'created_at';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'desc';

    // Filter hub
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    hub_source_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    hub_dest_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    current_hub?: number;
}


