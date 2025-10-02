export class CostBreakdownResponseDto {
    message: string;
    data: {
        asal: string;
        tujuan: string;
        rincian_biaya: {
            jarak_km: number;
            uang_jalan_full: number;
            uang_jalan_90_percent: number;
            uang_jalan_10_percent: number;
            cost_driver_1: number;
            cost_driver_2: number;
        };
        keterangan: string;
    };
}
