import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PickupSummaryDto {
    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @IsNumber()
    hub_id?: number;

    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @IsNumber()
    driver_id?: number;

    @IsOptional()
    @IsIn(['daily', 'weekly', 'monthly'])
    @IsString()
    interval?: string = 'daily';
} 