export class CreateTruckRentalOrderResponseDto {
    message: string;
    data: {
        no_tracking: string;
        layanan: string;
        origin_latlng: string;
        destination_latlng: string;
        jarak_km: number;
        isUseToll: boolean;
        toll_payment_method: number;
        truck_type: string;
        pickup_time: string;
        harga_dasar: string;
        total_harga: string;
        estimasi_waktu: string;
        keterangan_barang?: string;
        status: string;
        created_at: string;
    };
}
