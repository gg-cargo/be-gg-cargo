export class TrackingHelper {
    static generateNoTracking(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV${timestamp}${random}`;
    }
} 