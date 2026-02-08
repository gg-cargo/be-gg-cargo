import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';

export class SimulateTariffDto {
    @IsString()
    service_type: string;

    @IsString()
    sub_service: string;

    @IsOptional()
    @IsString()
    origin?: string | null;

    @IsOptional()
    @IsString()
    destination?: string | null;

    @IsDateString()
    effective_date: string;

    @IsOptional()
    @IsString()
    customer_id?: string;

    // Conditional fields based on pricing_type
    @IsOptional()
    @IsNumber()
    @Min(0)
    weight_kg?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    volume_m3?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    distance_km?: number;

    @IsOptional()
    @IsString()
    vehicle_type?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    rental_days?: number;

    @IsOptional()
    @IsString()
    item_type?: string;

    // Additional parameters
    @IsOptional()
    @IsBoolean()
    is_fragile?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    insurance_value?: number;

    @IsOptional()
    @IsString()
    promo_code?: string;
}
