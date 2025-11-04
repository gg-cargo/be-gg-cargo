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
    status?: string;

    @IsOptional()
    @IsString({ message: 'Layanan harus berupa string' })
    layanan?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Next Hub harus berupa angka' })
    next_hub?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Hub ID harus berupa angka' })
    hub_id?: number;

    @IsOptional()
    @IsIn(['barang', 'sewa_truk', 'international'], {
        message: 'Tipe harus berupa: barang, sewa_truk, atau international'
    })
    tipe?: string;
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
    alamat_pengirim: string;
    alamat_penerima: string;
    berat: string;
    koli: number;
    tanggal_pickup: string;
    jam: string;
    status: string;
    layanan: string;
    created_at: string;
    no_delivery_note?: string;
    hub_selanjutnya?: string;
    hub_tujuan?: string;
}

export class PaginationDto {
    current_page: number;
    limit: number;
    total_items: number;
    total_pages: number;
}

export class SummaryStatisticsDto {
    total_pengiriman: number;
    nota_kirim: number;
    pengiriman_berhasil: number;
    pengiriman_gagal: number;
    order_masuk: number;
    reweight: number;
    menunggu_driver: number;
    proses_penjemputan: number;
    proses_pengiriman: number;
}

export class OpsOrdersResponseDto {
    message: string;
    data: {
        summary: SummaryStatisticsDto;
        pagination: PaginationDto;
        orders: OrderOpsDto[];
    };
}
