import { IsNumber, IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfirmPickupDto {
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
    photo_base64?: string;

    @IsOptional()
    @IsString()
    signature_base64?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsNotEmpty()
    @IsString()
    latlng: string;

    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    user_id: number;

    @IsOptional()
    @IsString()
    reason?: string;
} 