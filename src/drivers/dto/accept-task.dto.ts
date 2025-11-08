export class AcceptTaskResponseDto {
    message: string;
    success: boolean;
    data: {
        task_id: number;
        task_type: 'pickup' | 'delivery';
        order_id: number;
        no_tracking: string;
        status: number;
        status_label: string;
        accepted_at: Date;
    };
}

