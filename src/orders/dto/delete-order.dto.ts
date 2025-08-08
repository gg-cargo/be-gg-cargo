import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteOrderDto {
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty({ message: 'User ID wajib diisi' })
    user_id: number;
} 