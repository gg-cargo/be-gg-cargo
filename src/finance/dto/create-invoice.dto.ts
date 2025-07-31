import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class CreateInvoiceDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    order_ids: number[];

    @IsDateString()
    invoice_date: string;

    @IsString()
    @IsNotEmpty()
    payment_terms: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    bill_to_name?: string;

    @IsString()
    @IsOptional()
    bill_to_phone?: string;

    @IsString()
    @IsOptional()
    bill_to_address?: string;

    @IsNumber()
    created_by_user_id: number;
}