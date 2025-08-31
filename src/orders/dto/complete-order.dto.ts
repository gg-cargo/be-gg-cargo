import { IsNotEmpty, IsNumber } from 'class-validator';

export class CompleteOrderDto {
    @IsNotEmpty()
    @IsNumber()
    completed_by_user_id: number;
}

export class CompleteOrderResponseDto {
    message: string;
    success: boolean;
    data: {
        no_tracking: string;
        status: string;
        completed_at: string;
        completed_by: number;
    };
}
