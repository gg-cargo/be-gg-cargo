import { IsOptional, IsString, IsNumber, IsIn, IsBoolean } from 'class-validator';
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
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Hub Asal harus berupa angka' })
    hub_source_id?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: 'Hub Tujuan harus berupa angka' })
    hub_dest_id?: number;

    @IsOptional()
    @IsIn(['barang', 'sewa_truk', 'international'], {
        message: 'Tipe harus berupa: barang, sewa_truk, atau international'
    })
    tipe?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    all_hubs?: boolean;
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
    hub_asal?: string;
    deliver_by?: any;
    status_pengiriman?: string;
    issetManifest_inbound?: number;
    vendor_id?: number;
    vendor_tracking_number?: string;
    pickup_driver_status?: number | null;
    delivery_driver_status?: number | null;
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
