import { IsNumber, IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfirmDeliveryDto {
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    order_id: number;

    @IsNotEmpty()
    @IsIn(['success', 'completed', 'failed', 'cancelled'])
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    photo?: string;

    @IsOptional()
    @IsString()
    signature?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsNotEmpty()
    @IsString()
    latlng: string;

    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @IsNumber()
    user_id?: number; // Akan di-override dengan driver_id dari JWT token

    @IsOptional()
    @IsString()
    reason?: string;
}

