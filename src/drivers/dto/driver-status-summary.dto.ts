import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class DriverStatusSummaryQueryDto {
    @IsOptional()
    @IsNumber({}, { message: 'Hub ID harus berupa angka' })
    @Transform(({ value }) => parseInt(value))
    hub_id?: number;

    @IsOptional()
    @IsDateString({}, { message: 'Format tanggal harus YYYY-MM-DD' })
    date?: string;

    @IsOptional()
    @IsString({ message: 'Status harus berupa string' })
    status?: 'online' | 'offline';
}

export class DriverWorkloadDto {
    pickup_tasks: number;
    delivery_tasks: number;
    tugas_pending: number;
}

export class DriverStatusSummaryDto {
    id: number;
    name: string;
    phone: string;
    status_ketersediaan: 'Sibuk' | 'Siap Menerima Tugas';
    lokasi_saat_ini: string;
    terakhir_update_gps: string;
    beban_kerja_hari_ini: DriverWorkloadDto;
    area_kerja: string;
}

export class DriverStatusSummaryResponseDto {
    status: string;
    date: string;
    hub_id?: number;
    drivers: DriverStatusSummaryDto[];
}
