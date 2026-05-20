import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class UpdateFleetTripLoadingPhotosDto {
  @IsArray({ message: 'file_log_ids harus berupa array' })
  @ArrayMinSize(1, { message: 'file_log_ids minimal 1 item' })
  @IsInt({ each: true, message: 'setiap file_log_id harus angka bulat' })
  @Min(1, { each: true, message: 'setiap file_log_id harus lebih dari 0' })
  file_log_ids: number[];
}
