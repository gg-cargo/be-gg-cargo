import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class WeightTierDto {
    @IsNumber()
    @Min(0)
    min_weight_kg: number;

    @IsNumber()
    @Min(0)
    max_weight_kg: number;

    @IsNumber()
    @Min(0)
    rate_per_kg: number;
}

class RoutePriceDto {
    @IsString()
    origin_city: string;

    @IsString()
    destination_city: string;

    @IsOptional()
    @IsString()
    item_type?: string;

    @IsNumber()
    @Min(0)
    price: number;
}

class DistanceTierDto {
    @IsNumber()
    @Min(0)
    min_km: number;

    @IsNumber()
    @Min(0)
    max_km: number;

    @IsNumber()
    @Min(0)
    rate_per_km: number;
}

class DistanceConfigDto {
    @IsNumber()
    @Min(0)
    base_price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    rate_per_km?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    min_km?: number;

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
    @IsString()
    vehicle_type: string;

    @IsNumber()
    @Min(0)
    daily_rate: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    max_hours?: number;
}

class SeaFreightConfigDto {
    @IsString()
    origin_port: string;

    @IsString()
    destination_port: string;

    @IsNumber()
    @Min(0)
    rate_per_cbm: number;

    @IsString()
    currency: string;
}

class SurchargeDto {
    @IsString()
    surcharge_type: string;

    @IsEnum(['PERCENT', 'FIXED'])
    calculation: string;

    @IsNumber()
    @Min(0)
    value: number;

    @IsOptional()
    @IsString()
    condition?: string;
}

export class UpdateTariffDto {
    @IsOptional()
    @IsString()
    service_type?: string;

    @IsOptional()
    @IsString()
    sub_service?: string;

    @IsOptional()
    @IsString()
    tariff_name?: string;

    @IsOptional()
    @IsEnum(['WEIGHT_BASED', 'ROUTE_BASED', 'DISTANCE_BASED', 'DAILY_BASED'])
    pricing_model?: string;

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

    @IsOptional()
    @IsNumber()
    barang_id?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    min_charge?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sla_hours?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsDateString()
    effective_start?: string;

    @IsOptional()
    @IsDateString()
    effective_end?: string;

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
