import { IsNotEmpty, IsNumber, IsString, IsIn } from 'class-validator';

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

    @IsNotEmpty({ message: 'Jenis tugas tidak boleh kosong' })
    @IsIn(['pickup', 'delivery'], { message: 'Jenis tugas harus pickup atau delivery' })
    task_type: 'pickup' | 'delivery';
}

export class AssignDriverResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        driver_id: number;
        driver_name: string;
        task_type: 'pickup' | 'delivery';
        assigned_at: string;
        assigned_by: string;
    };
}
