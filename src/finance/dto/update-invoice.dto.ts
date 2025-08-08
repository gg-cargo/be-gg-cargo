import { IsOptional, IsString, IsNumber, IsArray, IsDateString, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentStatus {
    DITAGIHKAN = 'ditagihkan',
    LUNAS = 'lunas'
}

export class BillingItemDto {
    @IsString()
    description: string;

    @IsNumber()
    quantity: number;

    @IsString()
    uom: string;

    @IsNumber()
    unit_price: number;

    @IsNumber()
    total: number;

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class UpdateInvoiceDto {
    // Invoice Date
    @IsOptional()
    @IsString()
    invoice_date?: string;

    // Payment Terms
    @IsOptional()
    @IsString()
    payment_terms?: string;

    // Payment Status
    @IsOptional()
    @IsEnum(PaymentStatus)
    status_payment?: PaymentStatus;

    // Payment Details
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

    @IsOptional()
    @IsString()
    paid_from_bank?: string;

    // Contract & Quotation
    @IsOptional()
    @IsString()
    contract_quotation?: string;

    // Billing Items
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BillingItemDto)
    billing_items?: BillingItemDto[];

    // Discount & Voucher
    @IsOptional()
    @IsNumber()
    discount_voucher_contract?: number;

    // Additional Charges
    @IsOptional()
    @IsNumber()
    asuransi_amount?: number;

    @IsOptional()
    @IsString()
    packing_amount?: string;

    // Tax Configuration
    @IsOptional()
    @IsNumber()
    pph_percentage?: number;

    @IsOptional()
    @IsNumber()
    pph_amount?: number;

    @IsOptional()
    @IsNumber()
    ppn_percentage?: number;

    @IsOptional()
    @IsNumber()
    ppn_amount?: number;

    // Gross Up
    @IsOptional()
    @IsBoolean()
    gross_up?: boolean;

    // Total
    @IsOptional()
    @IsNumber()
    total_all?: number;

    // Notes
    @IsOptional()
    @IsString()
    notes?: string;

    // Required field
    @IsNumber()
    updated_by_user_id: number;
} 