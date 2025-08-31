import { IsNumber } from 'class-validator';

export class InboundConfirmWebDto {
    @IsNumber()
    inbound_by_user_id: number;

    @IsNumber()
    destination_hub_id: number;
}

export class InboundConfirmWebResponseDto {
    message: string;
    success: boolean;
    data: {
        no_delivery_note: string;
        destination_hub_id: number;
        total_orders_confirmed: number;
        total_pieces_confirmed: number;
        orders_updated: {
            order_id: number;
            no_tracking: string;
            current_hub: number;
        }[];
        pieces_updated: {
            piece_id: string;
            status: 'success' | 'failed';
            message: string;
        }[];
        history_records_created: number;
    };
}
