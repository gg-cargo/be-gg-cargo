import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    service_code: string;

    @IsString()
    @IsNotEmpty()
    service_name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    is_international?: boolean;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsInt()
    @IsOptional()
    sort_order?: number;
}
