import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class AvailableDriversDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    hub_id?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    service_center_id?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    include_location?: boolean;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    only_online?: boolean;
} 