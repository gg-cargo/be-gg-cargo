export class UserDetailResponseDto {
    message: string;
    data: {
        id: number;
        code: string | null;
        name: string;
        email: string;
        phone: string;
        email_verified_at: Date | null;
        phone_verify_at: Date | null;
        level: {
            id: number;
            nama: string;
        };
        hub: {
            id: number;
            nama: string;
        } | null;
        service_center: {
            id: number;
            nama: string;
        } | null;
        aktif: number;
        status: string;
        nik: string | null;
        sim: string | null;
        stnk: string | null;
        kir: string | null;
        expired_sim: string | null;
        expired_stnk: string | null;
        expired_kir: string | null;
        no_polisi: string | null;
        address: string | null;
        location: string | null;
        created_at: Date;
        updated_at: Date;
        // Additional fields that might be useful
        customer: number;
        payment_terms: number;
        discount_rate: number;
        type_transporter: string | null;
        type_expeditor: number;
        stakeholder_id: number | null;
        aktif_disabled_super: number;
        status_app: number;
        isSales: number;
        isApprove: number;
        isHandover: number;
        show_price: number;
        saldo: number;
    };
} 