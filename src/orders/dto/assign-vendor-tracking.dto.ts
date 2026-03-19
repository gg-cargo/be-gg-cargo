import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignVendorTrackingDto {
    @IsString({ message: 'Nomor resi vendor harus berupa string' })
    @IsNotEmpty({ message: 'Nomor resi vendor tidak boleh kosong' })
    vendor_tracking_number: string;
}

export class AssignVendorTrackingResponseDto {
    message: string;
    data: {
        no_tracking: string;
        vendor_tracking_number: string;
    };
}

export class AssignVendorTrackingBulkItemDto {
    @IsString({ message: 'Nomor resi harus berupa string' })
    @IsNotEmpty({ message: 'Nomor resi tidak boleh kosong' })
    no_tracking: string;

    @IsString({ message: 'Nomor resi vendor harus berupa string' })
    @IsNotEmpty({ message: 'Nomor resi vendor tidak boleh kosong' })
    vendor_tracking_number: string;
}

export class AssignVendorTrackingBulkDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AssignVendorTrackingBulkItemDto)
    items: AssignVendorTrackingBulkItemDto[];

    // Optional: vendor_tracking_number yang sama untuk banyak no_tracking (jika ingin skema alternatif).
    // Jika items diisi lengkap per item, field ini boleh tidak diisi.
    @IsString()
    @IsOptional()
    vendor_tracking_number?: string;
}

export class AssignVendorTrackingBulkResultDto {
    no_tracking: string;
    status: 'success' | 'failed';
    message: string;
    vendor_tracking_number?: string;
}

export class AssignVendorTrackingBulkResponseDto {
    status: 'success';
    message: string;
    results: AssignVendorTrackingBulkResultDto[];
}


