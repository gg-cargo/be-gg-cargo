export class InvoiceStatusResponseDto {
    message: string;
    success: boolean;
    data: {
        invoice_no: string;
        status_action: string;
        current_status: string;
        updates: string[];
        order_id?: number;
        sisa_amount?: number;
    };
} 