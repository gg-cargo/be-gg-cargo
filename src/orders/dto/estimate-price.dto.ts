import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
    @IsNotEmpty()
    @IsString()
    provinsi: string;

    @IsNotEmpty()
    @IsString()
    kota: string;

    @IsNotEmpty()
    @IsString()
    kecamatan: string;

    @IsOptional()
    @IsString()
    kelurahan?: string;

    @IsOptional()
    @IsString()
    kodepos?: string;
}

export class ItemDetailsDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(0.1)
    @Max(1000)
    berat: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(500)
    panjang: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(500)
    lebar: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(500)
    tinggi: number;
}

export class ServiceOptionsDto {
    @IsNotEmpty()
    @IsString()
    layanan: string;

    @IsOptional()
    @IsBoolean()
    asuransi?: boolean;

    @IsOptional()
    @IsBoolean()
    packing?: boolean;

    @IsOptional()
    @IsString()
    voucher_code?: string;

    @IsOptional()
    @IsString()
    motor_type?: string;

    @IsOptional()
    @IsString()
    truck_type?: string;
}

export class EstimatePriceDto {
    @ValidateNested()
    @Type(() => LocationDto)
    origin: LocationDto;

    @ValidateNested()
    @Type(() => LocationDto)
    destination: LocationDto;

    @ValidateNested()
    @Type(() => ItemDetailsDto)
    item_details: ItemDetailsDto;

    @ValidateNested()
    @Type(() => ServiceOptionsDto)
    service_options: ServiceOptionsDto;
} 