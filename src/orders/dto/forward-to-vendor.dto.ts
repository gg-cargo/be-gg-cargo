import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class ForwardToVendorDto {
    @IsString({ message: 'Nama vendor harus berupa string' })
    @IsNotEmpty({ message: 'Nama vendor tidak boleh kosong' })
    vendor_name: string;

    @IsString({ message: 'PIC vendor harus berupa string' })
    @IsNotEmpty({ message: 'PIC vendor tidak boleh kosong' })
    pic_vendor: string;

    @IsString({ message: 'Nomor telepon vendor harus berupa string' })
    @IsNotEmpty({ message: 'Nomor telepon vendor tidak boleh kosong' })
    vendor_phone: string;

    @IsOptional()
    @IsString({ message: 'Catatan penerusan harus berupa string' })
    forwarding_note?: string;

    @IsNumber({}, { message: 'ID user yang meneruskan harus berupa angka' })
    forwarded_by_user_id: number;
}

export class ForwardToVendorResponseDto {
    message: string;
    data: {
        no_resi: string;
        vendor_name: string;
        pic_vendor: string;
        vendor_phone: string;
        forwarding_note?: string;
        forwarded_by_user_id: number;
        status: string;
        remark_traffic: string;
        next_hub: number;
        vendor_details: {
            name: string;
            pic: string;
            phone: string;
            note: string;
            forwarded_at: string;
            forwarded_by: string;
            destination_hub: {
                id: number;
                name: string;
                code: string;
            };
        };
    };
}
