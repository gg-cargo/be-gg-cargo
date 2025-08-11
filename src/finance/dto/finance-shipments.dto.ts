import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FinanceShipmentsDto {
    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : 1)
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : 20)
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(['belum proses', 'belum ditagih', 'sudah ditagih', 'unpaid', 'lunas'])
    billing_status?: string;

    @IsOptional()
    @IsString()
    layanan?: string;

    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    @IsString()
    invoice_date_start?: string;

    @IsOptional()
    @IsString()
    invoice_date_end?: string;

    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @Type(() => Number)
    @IsNumber()
    created_by_user_id?: number;

    @IsOptional()
    @IsIn(['no_tracking', 'created_at', 'nama_pengirim', 'nama_penerima', 'layanan', 'total_harga', 'status'])
    sort_by?: string = 'created_at';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: string = 'desc';
} 