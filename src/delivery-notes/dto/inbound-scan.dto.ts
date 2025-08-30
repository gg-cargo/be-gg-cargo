import { IsArray, IsNumber, IsString, ArrayMinSize } from 'class-validator';

export class InboundScanDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Minimal satu piece_id harus di-scan' })
    @IsString({ each: true, message: 'Setiap piece_id harus berupa string' })
    scanned_piece_ids: string[];

    @IsNumber()
    inbound_by_user_id: number;

    @IsNumber()
    destination_hub_id: number;
}

export class InboundScanResponseDto {
    message: string;
    success: boolean;
    data: {
        no_delivery_note: string;
        destination_hub_id: number;
        total_pieces_scanned: number;
        pieces_updated: {
            piece_id: string;
            status: 'success' | 'failed';
            message: string;
        }[];
        orders_updated: {
            order_id: number;
            no_tracking: string;
            status: string;
            current_hub: number;
        }[];
        manifest_records_created: number;
        history_records_created: number;
    };
}
