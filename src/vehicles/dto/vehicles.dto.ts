import { IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class VehiclesQueryDto {
    @IsOptional()
    @IsString({ message: 'Search harus berupa string' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    search?: string;

    @IsOptional()
    @IsIn(['0', '1', 0, 1], { message: 'Status harus 0 atau 1' })
    @Transform(({ value }) => (value === undefined ? value : Number(value)))
    status?: 0 | 1;
}

export class VehicleDto {
    id: number;
    no_polisi: string | null;
    jenis_mobil: string | null;
    max_berat: string | null;
    max_volume: string | null;
    type: string;
    status: number | null;
}

export class VehiclesResponseDto {
    status: string;
    vehicles: VehicleDto[];
}
