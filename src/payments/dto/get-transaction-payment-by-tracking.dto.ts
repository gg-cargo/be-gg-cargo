import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class TransactionPaymentDataDto {

    @IsString()
    price: string;

    @IsString()
    no_tracking: string;

    @IsString()
    link_payment: string;

    @IsOptional()
    @IsString()
    no_va?: string;

    @IsOptional()
    @IsString()
    expired_at?: string;
}

export class GetTransactionPaymentByTrackingResponseDto {
    @IsString()
    message: string;

    @IsString()
    data: TransactionPaymentDataDto;
}
