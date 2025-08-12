import { IsString, IsNumber, IsOptional } from 'class-validator';

export class InvoiceByTrackingDataDto {
    @IsString()
    no_tracking: string;

    @IsString()
    layanan: string;

    @IsNumber()
    total_harga: number;
}

export class GetInvoiceByTrackingResponseDto {
    @IsString()
    message: string;

    @IsString()
    data: InvoiceByTrackingDataDto;
}
