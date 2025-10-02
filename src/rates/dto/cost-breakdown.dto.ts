import { IsString, IsNotEmpty, IsNumberString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CostBreakdownDto {
    @IsString()
    @IsNotEmpty()
    origin_hub_code: string;

    @IsString()
    @IsNotEmpty()
    dest_hub_code: string;

    @Transform(({ value }) => parseInt(value))
    @Type(() => Number)
    @IsNotEmpty()
    distance_km: number;

    @IsString()
    @IsNotEmpty()
    truck_type: string;
}
