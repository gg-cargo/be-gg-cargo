import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class AvailableDriversDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    hub_id?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    service_center_id?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    include_location?: boolean;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    only_online?: boolean;
}

export class AvailableDriversForPickupDto {
    @Transform(({ value }) => (value !== undefined ? parseInt(value) : value))
    @IsNumber({}, { message: 'Order ID tidak boleh kosong' })
    order_id: number;

    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value) : value))
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
    service_center_id?: number;
    hub_id?: number;
    current_tasks: number;
    distance_from_order: number;
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