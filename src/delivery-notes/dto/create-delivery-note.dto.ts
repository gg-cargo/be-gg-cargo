import { IsArray, ArrayNotEmpty, IsInt, IsOptional, IsString, IsNotEmpty, IsIn, IsDateString } from 'class-validator';
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

    @IsOptional()
    @IsIn(['darat', 'laut', 'udara'], { message: 'transport_mode harus darat, laut, atau udara' })
    transport_mode?: 'darat' | 'laut' | 'udara';

    @IsOptional()
    @IsString({ message: 'no_polisi harus berupa string' })
    @IsNotEmpty({ message: 'no_polisi tidak boleh kosong' })
    no_polisi?: string;

    @IsOptional()
    @IsString({ message: 'jenis_kendaraan harus berupa string' })
    jenis_kendaraan?: string;

    @IsOptional()
    @IsString({ message: 'awb_number harus berupa string' })
    @IsNotEmpty({ message: 'awb_number tidak boleh kosong' })
    awb_number?: string;

    @IsOptional()
    @IsString({ message: 'aircraft_name harus berupa string' })
    @IsNotEmpty({ message: 'aircraft_name tidak boleh kosong' })
    aircraft_name?: string;

    @IsOptional()
    @IsString({ message: 'bl_number harus berupa string' })
    @IsNotEmpty({ message: 'bl_number tidak boleh kosong' })
    bl_number?: string;

    @IsOptional()
    @IsString({ message: 'vessel_name harus berupa string' })
    @IsNotEmpty({ message: 'vessel_name tidak boleh kosong' })
    vessel_name?: string;

    @IsOptional()
    @IsDateString({}, { message: 'etd harus berupa format waktu ISO string' })
    etd?: string;

    @IsOptional()
    @IsDateString({}, { message: 'eta harus berupa format waktu ISO string' })
    eta?: string;

    @IsOptional()
    @IsArray({ message: 'no_seal harus berupa array string' })
    @IsString({ each: true, message: 'Setiap no_seal harus berupa string' })
    no_seal?: string[];
}

export class CreateDeliveryNoteResponseDto {
    status: string;
    no_delivery_note: string;
    order_ids: number[];
}
