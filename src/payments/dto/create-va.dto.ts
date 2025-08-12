import { IsNumber, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVaDto {
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty({ message: 'Order ID wajib diisi' })
    order_id: number;

    @IsString()
    @IsNotEmpty({ message: 'Payment method wajib diisi' })
    @IsIn(['bca_va', 'mandiri_va', 'bni_va', 'bri_va', 'permata_va'], {
        message: 'Payment method harus salah satu dari: bca_va, mandiri_va, bni_va, bri_va, permata_va'
    })
    payment_method: string;

    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty({ message: 'Created by user ID wajib diisi' })
    created_by_user_id: number;
}
