export class CancelOrderResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        no_resi: string;
        status: string;
        reason: string;
        cancelled_by: string;
        cancelled_at: string;
        updates: string[];
    };
} 