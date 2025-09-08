import { IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderFieldsDto {
    @IsObject()
    data: Record<string, any>;

    @IsNumber()
    @Type(() => Number)
    updated_by_user_id: number;
}


