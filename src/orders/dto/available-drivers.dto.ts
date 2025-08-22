import { IsOptional, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class AvailableDriversQueryDto {
    @IsNotEmpty({ message: 'Order ID tidak boleh kosong' })
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Order ID harus berupa angka' })
    order_id: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Hub ID harus berupa angka' })
    hub_id?: number;
}

export class DriverLocationDto {
    lat: number;
    lng: number;
}

export class AvailableDriverDto {
    id: number;
    name: string;
    phone: string;
    current_location: DriverLocationDto;
    service_center_id: number;
    hub_id: number;
    current_tasks: number;
    distance_from_order: number; // dalam km
    is_available: boolean;
}

export class AvailableDriversResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        order_location: DriverLocationDto;
        available_drivers: AvailableDriverDto[];
        total_available: number;
    };
}
