import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class TransactionPaymentDataDto {

    @IsString()
    price: string;

    @IsString()
    no_tracking: string;

    @IsString()
    payment_link: string;

    @IsString()
    transaction_id: string;

    @IsOptional()
    @IsString()
    bank_name?: string;

    @IsOptional()
    @IsString()
    va_number?: string;

    @IsOptional()
    @IsString()
    expiry_time?: string;
}

export class GetTransactionPaymentByTrackingResponseDto {
    message: string;
    data: TransactionPaymentDataDto;
}
