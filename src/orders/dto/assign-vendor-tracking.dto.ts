import { IsNotEmpty, IsString } from 'class-validator';

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


