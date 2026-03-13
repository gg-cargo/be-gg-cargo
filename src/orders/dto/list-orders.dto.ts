import { IsOptional, IsBoolean, IsString, IsIn, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListOrdersDto {
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    keyword?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    missing_items?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    missing_hub?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['Reguler', 'Express', 'Paket', 'Sewa Truk', 'Kirim Motor', 'Kirim Hemat', 'International'])
    layanan?: string;
}
