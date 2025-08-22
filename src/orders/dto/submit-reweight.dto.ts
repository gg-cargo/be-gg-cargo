import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class SubmitReweightDto {
    @IsNotEmpty({ message: 'User ID yang melakukan submit tidak boleh kosong' })
    @IsNumber({}, { message: 'User ID harus berupa angka' })
    submitted_by_user_id: number;

    @IsOptional()
    @IsString({ message: 'Remark harus berupa string' })
    remark?: string;
}

export class SubmitReweightResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        reweight_status: number;
        total_berat: number;
        total_volume: number;
        invoice_created: boolean;
        invoice_data?: {
            invoice_no: string;
            invoice_id: number;
            total_amount: number;
        };
        submitted_at: string;
        submitted_by: string;
    };
}
