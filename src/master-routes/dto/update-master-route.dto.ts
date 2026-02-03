import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';

export class UpdateMasterRouteDto {
  @IsOptional()
  @IsString()
  origin_name?: string;

  @IsOptional()
  @IsNumber()
  origin_lat?: number;

  @IsOptional()
  @IsNumber()
  origin_lng?: number;

  @IsOptional()
  @IsString()
  destination_name?: string;

  @IsOptional()
  @IsNumber()
  destination_lat?: number;

  @IsOptional()
  @IsNumber()
  destination_lng?: number;

  @IsOptional()
  @IsIn(['one_way', 'round_trip', 'multi_drop'])
  route_type?: string;

  @IsOptional()
  @IsIn(['tol', 'non_tol', 'campuran'])
  road_constraint?: string;

  @IsOptional()
  @IsString()
  service_zone?: string;

  @IsOptional()
  @IsNumber()
  default_distance?: number;

  @IsOptional()
  @IsNumber()
  default_duration?: number;
}

