import { IsNotEmpty, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateMasterRouteDto {
  @IsNotEmpty()
  @IsString()
  origin_name: string;

  @IsNotEmpty()
  @IsNumber()
  origin_lat: number;

  @IsNotEmpty()
  @IsNumber()
  origin_lng: number;

  @IsNotEmpty()
  @IsString()
  destination_name: string;

  @IsNotEmpty()
  @IsNumber()
  destination_lat: number;

  @IsNotEmpty()
  @IsNumber()
  destination_lng: number;

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

