import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { FleetEstimateApprovalStatus } from '../../models/fleet-estimate.model';

export class ListFleetEstimatesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'], {
    message: 'approval_status harus pending, approved, atau rejected',
  })
  approval_status?: FleetEstimateApprovalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  created_by_user_id?: number;
}
