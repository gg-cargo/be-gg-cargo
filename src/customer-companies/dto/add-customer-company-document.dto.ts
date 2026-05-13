import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddCustomerCompanyDocumentDto {
    @IsString({ message: 'Tipe dokumen harus berupa string' })
    @IsIn(['nib', 'siup', 'nib_siup', 'npwp', 'akta', 'other'], {
        message: 'document_type tidak valid',
    })
    document_type: string;

    @IsOptional()
    @IsString({ message: 'Nomor dokumen harus berupa string' })
    document_number?: string;

    @Type(() => Number)
    @IsNumber({}, { message: 'file_log_id harus berupa angka' })
    file_log_id: number;
}
