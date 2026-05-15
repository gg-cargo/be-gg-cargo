import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum FleetEstimateTripType {
  ONE_WAY = 'one_way',
  TWO_WAY = 'two_way',
}

export enum FleetEstimateRoadType {
  NON_TOL = 'non_tol',
  TOL = 'tol',
  MANUAL = 'manual',
}

export class FleetEstimateDto {
  @IsString()
  @IsNotEmpty({ message: 'kota_asal wajib diisi' })
  @MaxLength(100)
  kota_asal: string;

  @IsString()
  @IsNotEmpty({ message: 'kota_tujuan wajib diisi' })
  @MaxLength(100)
  kota_tujuan: string;

  @IsEnum(FleetEstimateTripType, {
    message: 'trip_type harus one_way atau two_way',
  })
  trip_type: FleetEstimateTripType;

  @IsEnum(FleetEstimateRoadType, {
    message: 'road_type harus non_tol, tol, atau manual',
  })
  road_type: FleetEstimateRoadType;

  @Type(() => Number)
  @IsNumber({}, { message: 'distance_km harus angka' })
  @Min(0.01, { message: 'distance_km minimal 0.01' })
  @Max(10000, { message: 'distance_km maksimal 10000' })
  distance_km: number;

  @IsString()
  @IsNotEmpty({ message: 'vehicle_type wajib diisi' })
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  vehicle_type: string;
}
