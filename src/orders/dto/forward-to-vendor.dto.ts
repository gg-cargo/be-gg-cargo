import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class ForwardToVendorDto {
    @IsNumber({}, { message: 'ID vendor harus berupa angka' })
    vendor_id: number;

    @IsOptional()
    @IsString({ message: 'Catatan penugasan harus berupa string' })
    assignment_note?: string;

    @IsNumber({}, { message: 'ID user penugas harus berupa angka' })
    assigned_by_user_id: number;
}

export class ForwardToVendorResponseDto {
    status: 'success';
    message: string;
    data: {
        no_tracking: string;
        vendor_id: number;
        vendor_name: string;
    };
}
