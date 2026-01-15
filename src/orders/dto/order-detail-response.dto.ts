export class OrderDetailResponseDto {
    message: string;
    success: boolean;
    data: {
        order_info: {
            tracking_no: string;
            nama_barang: string;
            harga_barang: number;
            status: string;
            bypass_reweight: string;
            reweight_status: number;
            layanan: string;
            created_at: Date;
            updated_at: Date;
            vendor_id: number;
            vendor_tracking_number: string;
        };
        shipper: {
            name: string;
            address: string;
            phone: string;
            email: string;
            province: string;
            city: string;
            district: string;
            postal_code: string;
        };
        consignee: {
            name: string;
            address: string;
            phone: string;
            email: string;
            province: string;
            city: string;
            district: string;
            postal_code: string;
        };
        summary_metrics: {
            jumlah_koli: number;
            berat_aktual_kg: number;
            berat_volume_kg: number;
            kubikasi_m3: number;
            total_harga: number;
        };
        pieces_detail: Array<{
            id: number;
            piece_id: number;
            qty: number;
            berat: number;
            panjang: number;
            lebar: number;
            tinggi: number;
            reweight_status: number;
            pickup_status: number;
        }>;
    };
} 