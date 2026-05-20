import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FleetEstimateRoadType, FleetEstimateTripType } from './fleet-estimate.dto';

export enum FleetTripAssigneeTypeDto {
  MITRA = 'mitra',
  VENDOR = 'vendor',
}

export class FleetTripWaypointDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  sequence: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label: string;

  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class FleetTripSegmentRouteDto {
  @IsString()
  @IsNotEmpty()
  variant: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  jarak_km: number;

  @IsString()
  @IsNotEmpty()
  estimasi_waktu: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  biaya_tol_idr?: number;
}

export class FleetTripSegmentEstimateDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bbm_total: number;

  @IsString()
  @IsNotEmpty()
  fuel_type: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  toll_total?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_km_effective: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grand_total_operational: number;
}

export class FleetTripSegmentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  segment_no: number;

  @IsString()
  @IsNotEmpty()
  titik_asal: string;

  @IsString()
  @IsNotEmpty()
  titik_tujuan: string;

  @Type(() => Number)
  @IsNumber()
  titik_asal_lat: number;

  @Type(() => Number)
  @IsNumber()
  titik_asal_lng: number;

  @Type(() => Number)
  @IsNumber()
  titik_tujuan_lat: number;

  @Type(() => Number)
  @IsNumber()
  titik_tujuan_lng: number;

  @IsEnum(['tol', 'non_tol'], { message: 'road_type harus tol atau non_tol' })
  road_type: 'tol' | 'non_tol';

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_km: number;

  @ValidateNested()
  @Type(() => FleetTripSegmentRouteDto)
  route: FleetTripSegmentRouteDto;

  @ValidateNested()
  @Type(() => FleetTripSegmentEstimateDto)
  estimate: FleetTripSegmentEstimateDto;
}

export class FleetTripSummaryDto {
  @IsString()
  @IsNotEmpty()
  kota_asal: string;

  @IsString()
  @IsNotEmpty()
  kota_tujuan: string;

  @IsEnum(FleetEstimateTripType)
  trip_type: FleetEstimateTripType;

  @IsEnum(FleetEstimateRoadType)
  road_type: FleetEstimateRoadType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_km_total: number;

  @IsString()
  @IsNotEmpty()
  vehicle_type: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimasi_bbm_total: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimasi_tol_total: number;

  @IsString()
  @IsNotEmpty()
  estimasi_waktu_tiba: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  supir_1_total: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  supir_2_total?: number;

  @Type(() => Boolean)
  supir_2_eligible: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grand_total_operational: number;

  @IsOptional()
  @IsString()
  fuel_type?: string;
}

export class FleetTripAssignmentDto {
  @IsEnum(FleetTripAssigneeTypeDto, {
    message: 'assignee_type harus mitra atau vendor',
  })
  assignee_type: FleetTripAssigneeTypeDto;

  @Type(() => Number)
  @IsNumber()
  assigned_by_user_id: number;

  @ValidateIf((o) => o.assignee_type === FleetTripAssigneeTypeDto.MITRA)
  @Type(() => Number)
  @IsNumber()
  driver_1_user_id?: number;

  @IsOptional()
  @ValidateIf((o) => o.assignee_type === FleetTripAssigneeTypeDto.MITRA)
  @Type(() => Number)
  @IsNumber()
  driver_2_user_id?: number | null;

  @ValidateIf((o) => o.assignee_type === FleetTripAssigneeTypeDto.VENDOR)
  @Type(() => Number)
  @IsNumber()
  vendor_id?: number;
}

export class CreateFleetTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tracking_no?: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'waypoints minimal 2 titik' })
  @ValidateNested({ each: true })
  @Type(() => FleetTripWaypointDto)
  waypoints: FleetTripWaypointDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'segments minimal 1 leg' })
  @ValidateNested({ each: true })
  @Type(() => FleetTripSegmentDto)
  segments: FleetTripSegmentDto[];

  @ValidateNested()
  @Type(() => FleetTripSummaryDto)
  summary: FleetTripSummaryDto;

  @ValidateNested()
  @Type(() => FleetTripAssignmentDto)
  assignment: FleetTripAssignmentDto;
}
