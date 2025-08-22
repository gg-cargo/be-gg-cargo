import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AssignDriverDto {
    @IsNotEmpty({ message: 'Order ID tidak boleh kosong' })
    @IsNumber({}, { message: 'Order ID harus berupa angka' })
    order_id: number;

    @IsNotEmpty({ message: 'Driver ID tidak boleh kosong' })
    @IsNumber({}, { message: 'Driver ID harus berupa angka' })
    driver_id: number;

    @IsNotEmpty({ message: 'User ID yang melakukan penugasan tidak boleh kosong' })
    @IsNumber({}, { message: 'User ID harus berupa angka' })
    assigned_by_user_id: number;
}

export class AssignDriverResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        driver_id: number;
        driver_name: string;
        assigned_at: string;
        assigned_by: string;
    };
}
