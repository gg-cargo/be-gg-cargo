import { IsArray, IsNumber, IsOptional, IsString, ArrayMinSize, Min } from 'class-validator';

export class AssignDriverDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Minimal satu order ID harus diberikan' })
    @IsNumber({}, { each: true, message: 'Order ID harus berupa angka' })
    order_ids: number[];

    @IsNumber()
    @Min(1, { message: 'Driver ID harus lebih dari 0' })
    driver_id: number;

    @IsOptional()
    @IsString()
    notes?: string;
} 