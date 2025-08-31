export class CreateOrderResponseDto {
    order_id: number;
    no_tracking: string;
    status: string;
    message: string;
    invoice?: {
        invoice_no: string;
        invoice_date: string;
        total_amount: number;
        status: string;
    };
} 