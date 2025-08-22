export class ReweightBulkResponseDto {
    message: string;
    success: boolean;
    data: {
        pieces_updated: number;
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
        pieces_details: {
            piece_id: number;
            berat_lama: number;
            berat_baru: number;
            dimensi_lama: string;
            dimensi_baru: string;
        }[];
    };
}

