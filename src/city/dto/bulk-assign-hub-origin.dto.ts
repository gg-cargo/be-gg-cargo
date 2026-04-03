import { ArrayMinSize, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAssignHubOriginDto {
  @IsNumber({}, { message: 'hub_origin harus berupa angka' })
  @Min(1, { message: 'hub_origin minimal 1' })
  @Type(() => Number)
  hub_origin: number;

  @IsArray({ message: 'city_ids harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal 1 city harus dipilih' })
  @Type(() => Number)
  @IsNumber({}, { each: true, message: 'Setiap city_id harus berupa angka' })
  city_ids: number[];
}
