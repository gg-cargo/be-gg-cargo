import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class OpsOrdersQueryDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Page harus berupa angka' })
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Limit harus berupa angka' })
    limit?: number = 20;

    @IsOptional()
    @IsString({ message: 'Search harus berupa string' })
    search?: string;

    @IsOptional()
    @IsIn(['order jemput', 'reweight', 'menunggu pengiriman', 'dalam pengiriman', 'order kirim', 'completed'], {
        message: 'Status tidak valid'
    })
    status?: string;
}

export class CustomerDto {
    nama: string;
    telepon: string;
}

export class OrderOpsDto {
    no: number;
    order_id: number;
    no_resi: string;
    customer: CustomerDto;
    alamat_pickup: string;
    berat: string;
    koli: number;
    tanggal_pickup: string;
    jam: string;
    status: string;
    layanan: string;
    created_at: string;
}

export class PaginationDto {
    current_page: number;
    limit: number;
    total_items: number;
    total_pages: number;
}

export class OpsOrdersResponseDto {
    pagination: PaginationDto;
    orders: OrderOpsDto[];
}
