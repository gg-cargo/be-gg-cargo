import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RatesService {
    private readonly logger = new Logger(RatesService.name);
    private readonly mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;

    async calculateTruckRentalRate(originLatLng: string, destinationLatLng: string, tollFilter?: boolean) {
        try {
            let nonTollDistance: number = 0;
            let tollDistance: number = 0;
            let nonTollDuration: number = 0;
            let tollDuration: number = 0;

            // Tentukan rute mana yang perlu dihitung berdasarkan filter
            const needNonToll = tollFilter === undefined || tollFilter === false;
            const needToll = tollFilter === undefined || tollFilter === true;

            // Coba gunakan Mapbox API jika token tersedia
            if (this.mapboxAccessToken) {
                try {
                    // Ambil jarak dan durasi untuk rute non-tol (jika diperlukan)
                    if (needNonToll) {
                        const nonTollData = await this.getDistanceFromMapbox(
                            originLatLng,
                            destinationLatLng,
                            true // exclude toll
                        );
                        nonTollDistance = nonTollData.distance;
                        nonTollDuration = nonTollData.duration;
                    }

                    // Ambil jarak dan durasi untuk rute tol (jika diperlukan)
                    if (needToll) {
                        const tollData = await this.getDistanceFromMapbox(
                            originLatLng,
                            destinationLatLng,
                            false // include toll
                        );
                        tollDistance = tollData.distance;
                        tollDuration = tollData.duration;
                    }

                    this.logger.log('Successfully retrieved distances and durations from Mapbox API');
                } catch (mapboxError) {
                    this.logger.warn('Mapbox API failed, using fallback calculation:', mapboxError.message);
                    // Fallback ke perhitungan jarak manual
                    const fallbackDistances = this.calculateFallbackDistance(originLatLng, destinationLatLng);
                    nonTollDistance = fallbackDistances.nonToll;
                    tollDistance = fallbackDistances.toll;
                    // Gunakan estimasi waktu berdasarkan jarak untuk fallback
                    nonTollDuration = this.estimateDurationFromDistance(nonTollDistance);
                    tollDuration = this.estimateDurationFromDistance(tollDistance);
                }
            } else {
                this.logger.warn('MAPBOX_ACCESS_TOKEN not configured, using fallback calculation');
                // Fallback ke perhitungan jarak manual
                const fallbackDistances = this.calculateFallbackDistance(originLatLng, destinationLatLng);
                nonTollDistance = fallbackDistances.nonToll;
                tollDistance = fallbackDistances.toll;
                // Gunakan estimasi waktu berdasarkan jarak untuk fallback
                nonTollDuration = this.estimateDurationFromDistance(nonTollDistance);
                tollDuration = this.estimateDurationFromDistance(tollDistance);
            }

            // Hitung estimasi harga
            const nonTollEstimate = needNonToll ? this.calculatePrice(nonTollDistance, false) : null;
            const tollEstimate = needToll ? this.calculatePrice(tollDistance, true) : null;

            // Buat response berdasarkan filter
            if (tollFilter === true && tollEstimate) {
                // Response untuk rute tol saja
                return {
                    message: 'Estimasi harga sewa truk berhasil dihitung',
                    data: {
                        origin: originLatLng,
                        destination: destinationLatLng,
                        jarak_km: Math.round(tollDistance * 100) / 100,
                        estimasi_waktu: this.formatDuration(tollDuration),
                        harga_dasar: this.formatRupiah(tollEstimate.basePrice),
                        total: this.formatRupiah(tollEstimate.totalPrice),
                        is_toll: true
                    }
                };
            } else if (tollFilter === false && nonTollEstimate) {
                // Response untuk rute non-tol saja
                return {
                    message: 'Estimasi harga sewa truk berhasil dihitung',
                    data: {
                        origin: originLatLng,
                        destination: destinationLatLng,
                        jarak_km: Math.round(nonTollDistance * 100) / 100,
                        estimasi_waktu: this.formatDuration(nonTollDuration),
                        harga_dasar: this.formatRupiah(nonTollEstimate.basePrice),
                        total: this.formatRupiah(nonTollEstimate.totalPrice),
                        is_toll: false
                    }
                };
            } else {
                // Response untuk kedua rute (default)
                const response: any = {
                    message: 'Estimasi harga sewa truk berhasil dihitung',
                    data: {
                        origin: originLatLng,
                        destination: destinationLatLng,
                        estimasi_harga: {}
                    }
                };

                // Tambahkan data non-tol jika diperlukan
                if (needNonToll && nonTollEstimate) {
                    response.data.estimasi_harga.non_tol = {
                        jarak_km: Math.round(nonTollDistance * 100) / 100,
                        estimasi_waktu: this.formatDuration(nonTollDuration),
                        harga_dasar: this.formatRupiah(nonTollEstimate.basePrice),
                        total: this.formatRupiah(nonTollEstimate.totalPrice),
                        is_toll: false
                    };
                }

                // Tambahkan data tol jika diperlukan
                if (needToll && tollEstimate) {
                    response.data.estimasi_harga.tol = {
                        jarak_km: Math.round(tollDistance * 100) / 100,
                        estimasi_waktu: this.formatDuration(tollDuration),
                        harga_dasar: this.formatRupiah(tollEstimate.basePrice),
                        total: this.formatRupiah(tollEstimate.totalPrice),
                        is_toll: true
                    };
                }

                return response;
            }

        } catch (error) {
            this.logger.error('Error calculating truck rental rate:', error);
            throw error;
        }
    }

    private async getDistanceFromMapbox(
        originLatLng: string,
        destinationLatLng: string,
        excludeToll: boolean
    ): Promise<{ distance: number, duration: number }> {
        try {
            // Parse koordinat untuk memastikan format yang benar
            const [originLat, originLng] = originLatLng.split(',').map(coord => parseFloat(coord.trim()));
            const [destLat, destLng] = destinationLatLng.split(',').map(coord => parseFloat(coord.trim()));

            // Validasi koordinat lebih ketat
            if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
                throw new Error('Format koordinat tidak valid');
            }

            // Validasi range latitude (-90 sampai 90)
            if (originLat < -90 || originLat > 90 || destLat < -90 || destLat > 90) {
                throw new Error('Latitude harus antara -90 dan 90');
            }

            // Validasi range longitude (-180 sampai 180)
            if (originLng < -180 || originLng > 180 || destLng < -180 || destLng > 180) {
                throw new Error('Longitude harus antara -180 dan 180');
            }

            // Validasi koordinat Indonesia (approximate bounds)
            // Latitude Indonesia: -11° sampai 6°
            // Longitude Indonesia: 95° sampai 141°
            if (originLat < -11 || originLat > 6 || originLng < 95 || originLng > 141 ||
                destLat < -11 || destLat > 6 || destLng < 95 || destLng > 141) {
                this.logger.warn('Koordinat di luar batas Indonesia, namun tetap diproses');
            }

            // Format koordinat untuk Mapbox API (lng,lat) dengan presisi yang tepat
            const originCoords = `${originLng.toFixed(6)},${originLat.toFixed(6)}`;
            const destCoords = `${destLng.toFixed(6)},${destLat.toFixed(6)}`;

            const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox/driving';
            const coordinates = `${originCoords};${destCoords}`;

            const params = new URLSearchParams({
                access_token: this.mapboxAccessToken || '',
                geometries: 'geojson',
                overview: 'full'
            });

            // Tambahkan parameter exclude toll jika diperlukan
            if (excludeToll) {
                params.append('exclude', 'toll');
            }

            const url = `${baseUrl}/${coordinates}?${params.toString()}`;

            this.logger.log(`Calling Mapbox API: ${url.replace(this.mapboxAccessToken || '', '***')}`);

            const response = await axios.get(url, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'GG-Kargo-BE/1.0'
                }
            });

            if (!response.data.routes || response.data.routes.length === 0) {
                throw new Error('Tidak ada rute yang ditemukan untuk koordinat yang diberikan');
            }

            // Konversi jarak dari meter ke kilometer dan durasi dari detik ke menit
            const distanceInMeters = response.data.routes[0].distance;
            const distanceInKm = distanceInMeters / 1000;
            const durationInSeconds = response.data.routes[0].duration;
            const durationInMinutes = durationInSeconds / 60;

            this.logger.log(`Distance from Mapbox: ${distanceInKm} km, Duration: ${durationInMinutes} minutes (exclude toll: ${excludeToll})`);

            return {
                distance: distanceInKm,
                duration: durationInMinutes
            };

        } catch (error) {
            if (error.response) {
                this.logger.error('Mapbox API Error Response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });

                if (error.response.status === 404) {
                    throw new Error('Koordinat tidak ditemukan atau tidak dapat dijangkau oleh Mapbox API');
                } else if (error.response.status === 401) {
                    throw new Error('Mapbox access token tidak valid atau expired');
                } else if (error.response.status === 422) {
                    throw new Error('Parameter koordinat tidak valid untuk Mapbox API');
                }
            }

            this.logger.error('Error calling Mapbox API:', error.message);
            throw new Error(`Gagal mendapatkan data jarak dari Mapbox: ${error.message}`);
        }
    }

    private calculatePrice(distanceKm: number, includeToll: boolean): {
        basePrice: number;
        tollFee: number;
        totalPrice: number;
    } {
        // Jarak efektif dengan minimum 55 km
        const effectiveDistance = Math.max(distanceKm, 55);

        // Hitung harga dasar berdasarkan jarak
        let basePrice: number;
        if (effectiveDistance < 500) {
            basePrice = effectiveDistance * 2800;
        } else {
            basePrice = effectiveDistance * 2500;
        }

        // Tidak menghitung biaya tol lagi, total = harga dasar
        const tollFee = 0;
        const totalPrice = basePrice;

        this.logger.log(`Price calculation - Distance: ${effectiveDistance}km, Base: ${basePrice}, Total: ${totalPrice}`);

        return {
            basePrice,
            tollFee,
            totalPrice
        };
    }

    private calculateFallbackDistance(originLatLng: string, destinationLatLng: string): {
        nonToll: number;
        toll: number;
    } {
        try {
            // Parse koordinat
            const [originLat, originLng] = originLatLng.split(',').map(coord => parseFloat(coord.trim()));
            const [destLat, destLng] = destinationLatLng.split(',').map(coord => parseFloat(coord.trim()));

            // Validasi koordinat
            if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
                throw new Error('Format koordinat tidak valid');
            }

            // Hitung jarak menggunakan formula Haversine
            const distance = this.calculateHaversineDistance(originLat, originLng, destLat, destLng);

            // Estimasi jarak untuk rute non-tol dan tol
            // Rute tol biasanya lebih pendek 10-20%
            const tollDistance = distance * 0.85; // 15% lebih pendek
            const nonTollDistance = distance; // Jarak asli

            this.logger.log(`Fallback calculation - Non-tol: ${nonTollDistance}km, Toll: ${tollDistance}km`);

            return {
                nonToll: nonTollDistance,
                toll: tollDistance
            };

        } catch (error) {
            this.logger.error('Error in fallback distance calculation:', error);
            // Return default distances jika ada error
            return {
                nonToll: 100, // Default 100km
                toll: 85      // Default 85km
            };
        }
    }

    private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius bumi dalam kilometer
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Jarak dalam kilometer

        return distance;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    private formatRupiah(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format durasi dari menit ke format yang mudah dibaca
     */
    private formatDuration(durationMinutes: number): string {
        if (durationMinutes < 60) {
            return `${Math.round(durationMinutes)} menit`;
        } else if (durationMinutes < 1440) { // Kurang dari 24 jam
            const hours = Math.floor(durationMinutes / 60);
            const minutes = Math.round(durationMinutes % 60);
            return minutes > 0 ? `${hours} jam ${minutes} menit` : `${hours} jam`;
        } else { // 24 jam atau lebih
            const days = Math.floor(durationMinutes / 1440);
            const remainingMinutes = durationMinutes % 1440;
            const hours = Math.floor(remainingMinutes / 60);
            const minutes = Math.round(remainingMinutes % 60);

            if (hours > 0) {
                return minutes > 0 ? `${days} hari ${hours} jam ${minutes} menit` : `${days} hari ${hours} jam`;
            } else {
                return minutes > 0 ? `${days} hari ${minutes} menit` : `${days} hari`;
            }
        }
    }

    /**
     * Estimasi durasi berdasarkan jarak (untuk fallback)
     * Asumsi kecepatan rata-rata 50 km/jam untuk truk
     */
    private estimateDurationFromDistance(distanceKm: number): number {
        const averageSpeedKmh = 50; // Kecepatan rata-rata truk
        return (distanceKm / averageSpeedKmh) * 60; // Konversi ke menit
    }
}
