export class ReweightBulkResponseDto {
    message: string;
    success: boolean;
    data: {
        actions_summary: {
            pieces_updated: number;
            pieces_deleted: number;
            pieces_added: number;
        };
        order_id: number;
        order_reweight_completed: boolean;
        images_uploaded?: {
            file_name: string;
            file_path: string;
            file_id: number;
        }[];
        invoice_created?: {
            invoice_no: string;
            invoice_id: number;
            total_amount: number;
        } | null;
        actions_details: {
            action: 'update' | 'delete' | 'add';
            piece_id: number;
            status: 'success' | 'failed';
            message: string;
            old_data?: {
                berat?: number;
                panjang?: number;
                lebar?: number;
                tinggi?: number;
            };
            new_data?: {
                berat?: number;
                panjang?: number;
                lebar?: number;
                tinggi?: number;
            };
        }[];
    };
}

