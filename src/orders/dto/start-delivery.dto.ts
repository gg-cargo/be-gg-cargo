import { IsOptional, IsString } from 'class-validator';

export class StartDeliveryDto {
    @IsString()
    @IsOptional()
    alasan?: string;

    @IsString()
    @IsOptional()
    catatan?: string;
}

export class StartDeliveryResponseDto {
    message: string;
    data: {
        no_tracking: string;
        status: string;
    };
}




