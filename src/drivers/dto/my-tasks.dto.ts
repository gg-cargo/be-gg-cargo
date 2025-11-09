import { IsOptional, IsIn, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class MyTasksQueryDto {
    @IsOptional()
    @IsIn(['pickup', 'delivery', 'all'], { message: 'task_type harus salah satu dari: pickup, delivery, all' })
    task_type?: 'pickup' | 'delivery' | 'all';

    @IsOptional()
    @IsIn(['0', '1', '2', 'completed'], { message: 'status harus salah satu dari: 0 (pending), 1 (in progress/assigned), 2 (failed), completed (selesai dengan bukti foto)' })
    status?: string;

    @IsOptional()
    @IsDateString({}, { message: 'date_from harus berupa format tanggal yang valid' })
    date_from?: string;

    @IsOptional()
    @IsDateString({}, { message: 'date_to harus berupa format tanggal yang valid' })
    date_to?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'page harus berupa angka' })
    @Min(1, { message: 'page harus lebih dari 0' })
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'limit harus berupa angka' })
    @Min(1, { message: 'limit harus lebih dari 0' })
    limit?: number;
}

export class DriverTaskDto {
    task_id: number;
    task_type: 'pickup' | 'delivery';
    order_id: number;
    no_tracking: string;
    nama_pengirim: string;
    alamat_pengirim: string;
    kota_pengirim: string;
    no_telepon_pengirim: string;
    nama_penerima: string;
    alamat_penerima: string;
    kota_penerima: string;
    no_telepon_penerima: string;
    status: number;
    reweight_status?: number;
    status_label: string;
    assign_date: Date;
    notes?: string;
    latlng?: string;
    nama_barang?: string;
    layanan?: string;
    hub_name?: string;
    barang_info?: {
        jumlah_koli: number;
        total_berat_kg: number;
        detail_koli?: Array<{
            piece_id: string;
            berat: number;
            panjang: number;
            lebar: number;
            tinggi: number;
        }>;
    };
}

export class TaskStatisticsDto {
    total_tasks: number;
    total_pickup: number;
    total_delivery: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    completed_pickup: number;
    completed_delivery: number;
}

export class MyTasksResponseDto {
    message: string;
    success: boolean;
    data: {
        tasks: DriverTaskDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
        statistics: TaskStatisticsDto;
    };
}

