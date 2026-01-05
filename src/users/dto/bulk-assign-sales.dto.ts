import { IsArray, IsNumber, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAssignSalesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 customer harus dipilih' })
  @Type(() => Number)
  @IsNumber({}, { each: true })
  customer_ids: number[];

  @IsNumber()
  @IsNotEmpty({ message: 'Sales ID wajib diisi' })
  @Type(() => Number)
  sales_id: number;
}

