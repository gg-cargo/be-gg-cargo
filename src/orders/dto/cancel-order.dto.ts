import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CancelOrderDto {
    @IsString({ message: 'Reason harus berupa string' })
    @IsNotEmpty({ message: 'Reason wajib diisi' })
    reason: string;

    @IsNumber()
    @Type(() => Number)
    cancelled_by_user_id: number;
} 