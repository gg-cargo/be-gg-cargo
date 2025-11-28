export class BypassReweightResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        no_tracking: string;
        bypass_reweight_status: string;
        reason?: string;
        updated_by_user: string;
        updated_at: Date;
        order_pieces_updated: number;
        proof_image?: {
            file_name: string;
            file_path: string;
            file_id: number;
        } | null;
        invoice_created?: {
            invoice_no: string;
            invoice_id: number;
            total_amount: number;
        } | null;
        invoice_email_sent?: boolean;
        invoice_email_error?: string;
    };
} 