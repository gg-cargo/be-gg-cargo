import { IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateDepartureDto {
  @IsOptional()
  @IsNumber()
  truck_id?: number;

  @IsOptional()
  @IsNumber()
  driver_id?: number;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsNumber()
  assigned_route_id?: number;

  @IsOptional()
  @IsNumber()
  est_fuel?: number;

  @IsOptional()
  @IsNumber()
  est_driver1?: number;

  @IsOptional()
  @IsNumber()
  est_driver2?: number;

  @IsOptional()
  @IsNumber()
  other_costs?: number;
}

