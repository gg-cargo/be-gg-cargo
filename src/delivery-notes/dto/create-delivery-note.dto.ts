import { IsArray, ArrayNotEmpty, IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeliveryNoteDto {
    @IsArray({ message: 'resi_list harus berupa array' })
    @ArrayNotEmpty({ message: 'resi_list tidak boleh kosong' })
    @IsString({ each: true, message: 'Setiap resi harus berupa string' })
    resi_list: string[];

    @Type(() => Number)
    @IsInt({ message: 'hub_asal_id harus berupa angka' })
    hub_asal_id: number;

    @Type(() => Number)
    @IsInt({ message: 'hub_tujuan_id harus berupa angka' })
    hub_tujuan_id: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'hub_transit_id harus berupa angka' })
    hub_transit_id?: number;

    @Type(() => Number)
    @IsInt({ message: 'transporter_id harus berupa angka' })
    transporter_id: number;

    @IsString({ message: 'no_polisi harus berupa string' })
    @IsNotEmpty({ message: 'no_polisi tidak boleh kosong' })
    no_polisi: string;

    @IsOptional()
    @IsString({ message: 'jenis_kendaraan harus berupa string' })
    jenis_kendaraan?: string;
}

export class CreateDeliveryNoteResponseDto {
    status: string;
    no_delivery_note: string;
    order_ids: number[];
}
