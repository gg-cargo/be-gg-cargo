import { IsOptional, IsString, IsInt } from 'class-validator';

export class RevertInTransitDto {
    @IsString()
    @IsOptional()
    alasan?: string;

    @IsString()
    @IsOptional()
    catatan?: string;

    @IsInt()
    @IsOptional()
    hub_id?: number;
}

export class RevertInTransitResponseDto {
    message: string;
    data: {
        no_tracking: string;
        status: string | null;
        reweight_status: number;
        hub_dest_id: number | null;
    };
}


