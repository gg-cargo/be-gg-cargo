import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableTransportersQueryDto {
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    hub_id?: number;

    @Type(() => Number)
    @IsInt()
    @IsOptional()
    svc_id?: number;
}

export class AvailableTransporterDto {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    hub_id: number | null;
    service_center_id: number | null;
    status_ketersediaan: string;
    lokasi_saat_ini: string | null;
    terakhir_update_gps: string | null;
}

export class AvailableTransportersResponseDto {
    transporters: AvailableTransporterDto[];
}


