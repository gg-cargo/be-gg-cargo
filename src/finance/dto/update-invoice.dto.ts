import { IsOptional, IsString, IsNumber, IsArray, IsDateString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentStatus {
    PAID = 'paid',
    PARTIAL_PAID = 'partial_paid',
    UNPAID = 'unpaid',
    CANCELLED = 'cancelled'
}

export class UpdateInvoiceItemDto {
    @IsNumber()
    invoice_detail_id: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsString()
    uom?: string;

    @IsOptional()
    @IsNumber()
    unit_price?: number;

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class UpdateInvoiceDto {
    // Payment Status Update
    @IsOptional()
    @IsEnum(PaymentStatus)
    status_payment?: PaymentStatus;

    @IsOptional()
    @IsNumber()
    payment_amount?: number;

    @IsOptional()
    @IsDateString()
    payment_date?: string;

    @IsOptional()
    @IsString()
    payment_method?: string;

    @IsOptional()
    @IsString()
    paid_attachment_url?: string;

    // General Invoice Update
    @IsOptional()
    @IsString()
    payment_terms?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    // Item Updates
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateInvoiceItemDto)
    update_items?: UpdateInvoiceItemDto[];

    // Required field
    @IsNumber()
    updated_by_user_id: number;
} 