import { IsOptional, IsString, IsNumber, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class RevenueSummaryByServiceDto {
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    hub_id?: number;

    @IsOptional()
    @IsString()
    @IsIn(['Kirim Hemat', 'Reguler', 'Express', 'Paket', 'Sewa Truk', 'Kirim Motor'])
    layanan?: string;
} 