import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FinanceSummaryDto {
    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @Type(() => Number)
    @IsNumber()
    hub_id?: number;

    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @Type(() => Number)
    @IsNumber()
    svc_id?: number;
} 