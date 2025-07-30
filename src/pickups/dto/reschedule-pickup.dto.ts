import { IsNumber, IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReschedulePickupDto {
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    order_id: number;

    @IsNotEmpty()
    @IsDateString()
    new_pickup_time: string;

    @IsNotEmpty()
    @IsString()
    reason_reschedule: string;

    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    rescheduled_by_user_id: number;
} 