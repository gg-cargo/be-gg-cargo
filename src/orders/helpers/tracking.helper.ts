export class TrackingHelper {
    static generateNoTracking(): string {
        // Ambil tanggal sekarang dalam format YYMMDD
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2); // 2 digit terakhir tahun
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Bulan 2 digit
        const day = now.getDate().toString().padStart(2, '0'); // Tanggal 2 digit
        // 6 digit random
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        // Gabungkan menjadi GG + YYMMDD + 6 digit random
        return `GG${year}${month}${day}${random}`;
    }
} 