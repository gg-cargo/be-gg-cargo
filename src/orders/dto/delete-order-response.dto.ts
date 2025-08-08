export class DeleteOrderResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        no_resi: string;
        deleted_by: string;
        deleted_at: string;
        deleted_tables: string[];
        deleted_records_count: {
            order_pieces: number;
            order_shipments: number;
            order_invoices: number;
            request_cancel: number;
            order_delivery_notes: number;
            order_histories: number;
        };
    };
} 