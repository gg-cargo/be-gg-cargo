import { IsString, IsEmail, IsNumber, IsOptional, IsIn, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Nama minimal 2 karakter' })
    name?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email tidak valid' })
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsNumber()
    level_id?: number;

    @IsOptional()
    @IsNumber()
    hub_id?: number;

    @IsOptional()
    @IsNumber()
    service_center_id?: number;

    @IsOptional()
    @IsNumber()
    @IsIn([0, 1])
    aktif?: number;

    @IsOptional()
    @IsString()
    nik?: string;

    @IsOptional()
    @IsString()
    sim?: string;

    @IsOptional()
    @IsString()
    stnk?: string;

    @IsOptional()
    @IsString()
    kir?: string;

    @IsOptional()
    @IsString()
    expired_sim?: string;

    @IsOptional()
    @IsString()
    expired_stnk?: string;

    @IsOptional()
    @IsString()
    expired_kir?: string;

    @IsOptional()
    @IsString()
    no_polisi?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsNumber()
    customer?: number;

    @IsOptional()
    @IsNumber()
    payment_terms?: number;

    @IsOptional()
    @IsNumber()
    discount_rate?: number;

    @IsOptional()
    @IsString()
    type_transporter?: string;

    @IsOptional()
    @IsNumber()
    type_expeditor?: number;

    @IsOptional()
    @IsNumber()
    stakeholder_id?: number;

    @IsOptional()
    @IsNumber()
    aktif_disabled_super?: number;

    @IsOptional()
    @IsNumber()
    status_app?: number;

    @IsOptional()
    @IsNumber()
    isSales?: number;

    @IsOptional()
    @IsNumber()
    isApprove?: number;

    @IsOptional()
    @IsNumber()
    isHandover?: number;

    @IsOptional()
    @IsNumber()
    show_price?: number;
} 