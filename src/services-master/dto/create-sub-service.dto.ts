import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { PricingType } from '../../models/sub-service.model';

export class CreateSubServiceDto {
    @IsUUID()
    @IsNotEmpty()
    service_id: string;

    @IsString()
    @IsNotEmpty()
    sub_service_name: string;

    @IsInt()
    @IsOptional()
    sla_hours?: number;

    @IsEnum(PricingType)
    @IsNotEmpty()
    pricing_type: string;

    @IsNumber()
    @IsOptional()
    default_multiplier?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsInt()
    @IsOptional()
    sort_order?: number;
}
