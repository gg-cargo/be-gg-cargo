import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class WeightTierDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    min_weight_kg: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    max_weight_kg: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    rate_per_kg: number;
}

class RoutePriceDto {
    @IsNotEmpty()
    @IsString()
    origin_city: string;

    @IsNotEmpty()
    @IsString()
    destination_city: string;

    @IsOptional()
    @IsString()
    item_type?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;
}

class DistanceTierDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    min_km: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    max_km: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    surcharge: number;
}

class DistanceConfigDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    base_price: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    rate_per_km: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    max_km?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DistanceTierDto)
    distance_tiers?: DistanceTierDto[];
}

class VehicleDailyRateDto {
    @IsNotEmpty()
    @IsString()
    vehicle_type: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    daily_rate: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    max_hours?: number;
}

class SeaFreightConfigDto {
    @IsNotEmpty()
    @IsString()
    origin_port: string;

    @IsNotEmpty()
    @IsString()
    destination_port: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    rate_per_cbm: number;

    @IsNotEmpty()
    @IsString()
    currency: string;
}

class SurchargeDto {
    @IsNotEmpty()
    @IsString()
    surcharge_type: string;

    @IsNotEmpty()
    @IsEnum(['PERCENT', 'FIXED'])
    calculation: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    value: number;

    @IsOptional()
    @IsString()
    condition?: string;
}

export class CreateTariffDto {
    @IsNotEmpty()
    @IsString()
    service_type: string;

    @IsNotEmpty()
    @IsString()
    sub_service: string;

    @IsNotEmpty()
    @IsString()
    tariff_name: string;

    @IsNotEmpty()
    @IsEnum(['WEIGHT_BASED', 'ROUTE_BASED', 'DISTANCE_BASED', 'DAILY_BASED'])
    pricing_model: string;

    @IsOptional()
    @IsString()
    customer_id?: string;

    @IsOptional()
    @IsString()
    origin_zone?: string;

    @IsOptional()
    @IsString()
    destination_zone?: string;

    @IsOptional()
    @IsString()
    vehicle_type?: string;

    @IsNotEmpty()
    @IsString()
    currency: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    min_charge: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sla_hours?: number;

    @IsNotEmpty()
    @IsBoolean()
    is_active: boolean;

    @IsNotEmpty()
    @IsDateString()
    effective_start: string;

    @IsOptional()
    @IsDateString()
    effective_end?: string;

    // Conditional fields based on pricing_model
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WeightTierDto)
    weight_tiers?: WeightTierDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoutePriceDto)
    route_prices?: RoutePriceDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => DistanceConfigDto)
    distance_config?: DistanceConfigDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VehicleDailyRateDto)
    vehicle_daily_rates?: VehicleDailyRateDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => SeaFreightConfigDto)
    sea_freight_config?: SeaFreightConfigDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SurchargeDto)
    surcharges?: SurchargeDto[];
}

export class BulkCreateTariffDto {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTariffDto)
    bulk_tariffs: CreateTariffDto[];

    @IsOptional()
    @IsString()
    created_by?: string;
}
