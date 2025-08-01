export class UpdateOrderResponseDto {
    no_resi: string;
    status: string;
    message: string;
    updated_fields: string[];
    order_pieces_updated?: number;
} 