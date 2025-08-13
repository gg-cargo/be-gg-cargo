import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class TransactionPaymentDataDto {

    @IsString()
    price: string;

    @IsString()
    no_tracking: string;

    @IsString()
    link_payment: string;

    @IsString()
    transaction_id: string;

    @IsOptional()
    @IsString()
    bank_name?: string;

    @IsOptional()
    @IsString()
    no_va?: string;

    @IsOptional()
    @IsString()
    expired_at?: string;
}

export class GetTransactionPaymentByTrackingResponseDto {
    message: string;
    data: TransactionPaymentDataDto;
}
