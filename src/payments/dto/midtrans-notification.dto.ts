import { IsString, IsOptional, IsArray, ValidateNested, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

class VaNumberDto {
    @IsString()
    va_number: string;

    @IsString()
    bank: string;
}

export class MidtransNotificationDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VaNumberDto)
    va_numbers?: VaNumberDto[];

    @IsString()
    transaction_time: string;

    @IsString()
    transaction_status: string;

    @IsString()
    transaction_id: string;

    @IsString()
    status_message: string;

    @IsString()
    status_code: string;

    @IsString()
    signature_key: string;

    @IsOptional()
    @IsString()
    settlement_time?: string;

    @IsString()
    payment_type: string;

    @IsOptional()
    @IsArray()
    payment_amounts?: any[];

    @IsString()
    order_id: string;

    @IsString()
    merchant_id: string;

    @IsString()
    gross_amount: string;

    @IsString()
    fraud_status: string;

    @IsOptional()
    @IsString()
    expiry_time?: string;

    @IsString()
    currency: string;
}
