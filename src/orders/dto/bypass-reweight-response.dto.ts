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
    };
} 