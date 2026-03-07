import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectTaskDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    rejection_reason?: string;
}

export class RejectTaskResponseDto {
    message: string;
    success: boolean;
    data: {
        task_id: number;
        task_type: 'pickup' | 'delivery';
        order_id: number;
        no_tracking: string;
        rejected_by: string;
        rejected_at: Date;
    };
}
