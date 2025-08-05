export class ServiceSummaryDto {
    layanan: string;
    jumlah_order: number;
    total_pendapatan: number;
    rata_rata_pendapatan_per_order: number;
    total_berat: number;
}

export class GrandTotalDto {
    jumlah_order: number;
    total_pendapatan: number;
    rata_rata_pendapatan_per_order: number;
    total_berat: number;
}

export class RevenueSummaryByServiceResponseDto {
    message: string;
    success: boolean;
    data: {
        periode: string;
        summary_by_service: ServiceSummaryDto[];
        grand_total: GrandTotalDto;
    };
} 