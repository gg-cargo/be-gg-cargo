/**
 * Utility functions untuk format tanggal dan waktu
 */

/**
 * Mendapatkan tanggal dalam format YYYY-MM-DD
 */
export function getFormattedDate(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
}

/**
 * Mendapatkan waktu dalam format HH:MM:SS (24 jam)
 */
export function getFormattedTime(date: Date = new Date()): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Mendapatkan tanggal dan waktu untuk order history
 */
export function getOrderHistoryDateTime(date: Date = new Date()): { date: string; time: string } {
    return {
        date: getFormattedDate(date),
        time: getFormattedTime(date)
    };
}

/**
 * Format tanggal Indonesia (contoh: 15 Januari 2024)
 */
export function getIndonesianDate(date: Date = new Date()): string {
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Format waktu Indonesia (contoh: 14:30:25)
 */
export function getIndonesianTime(date: Date = new Date()): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format tanggal dan waktu lengkap Indonesia
 */
export function getIndonesianDateTime(date: Date = new Date()): string {
    return `${getIndonesianDate(date)} ${getIndonesianTime(date)}`;
}
