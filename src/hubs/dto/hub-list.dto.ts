import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class HubListQueryDto {
    @IsOptional()
    @IsString({ message: 'Search harus berupa string' })
    @Transform(({ value }) => value?.trim())
    search?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'User ID harus berupa angka' })
    user_id?: number;
}

export class HubDataDto {
    id: number;
    kode: string;
    nama: string;
    alamat: string;
    phone: string;
    latLang: string | null;
    group_id: string | null;
}

export class HubListResponseDto {
    status: string;
    total_items: number;
    hubs: HubDataDto[];
}
