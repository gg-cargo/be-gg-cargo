export class UpdateOrderResponseDto {
    message: string;
    success: boolean;
    data: {
        no_resi: string;
        updated_fields: string[];
        order_pieces_updated?: number;
    };
} 