import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { FleetEstimateDto } from './fleet-estimate.dto';

export class CreateFleetEstimateDto extends FleetEstimateDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'driver_1_user_id harus angka' })
  driver_1_user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'driver_2_user_id harus angka' })
  driver_2_user_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  driver_1_account_no?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  driver_2_account_no?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'loading_photo_file_log_id harus angka' })
  loading_photo_file_log_id?: number;
}
