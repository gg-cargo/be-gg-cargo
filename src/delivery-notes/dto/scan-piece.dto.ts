import { IsNumber, IsString } from 'class-validator';

export class ScanPieceDto {
    @IsNumber()
    scanned_by_user_id: number;

    @IsNumber()
    destination_hub_id: number;
}

export class ScanPieceResponseDto {
    message: string;
    success: boolean;
    data: {
        piece_id: string;
        order_id: number;
        no_tracking: string;
        current_hub: number;
        hub_name: string;
        inbound_status: number;
        scanned_at: Date;
        order_updated: boolean;
        history_created: boolean;
        manifest_created: boolean;
    };
}



