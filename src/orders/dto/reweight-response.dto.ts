export class ReweightPieceResponseDto {
    message: string;
    success: boolean;
    data: {
        piece_id: number;
        order_id: number;
        berat_lama: number;
        berat_baru: number;
        dimensi_lama: string;
        dimensi_baru: string;
        reweight_status: number;
        order_reweight_completed: boolean;
    };
} 