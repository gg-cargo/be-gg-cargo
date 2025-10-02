export class UpdateItemDetailsResponseDto {
    message: string;
    order: {
        no_tracking: string;
        jumlah_koli?: number;
        total_berat?: number | string;
        total_kubikasi?: number;
        updated_at: Date;
    };
}
