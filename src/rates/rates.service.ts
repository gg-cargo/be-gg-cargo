import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { CostBreakdownDto } from './dto/cost-breakdown.dto';
import { CostBreakdownResponseDto } from './dto/cost-breakdown-response.dto';
const pricingRules = require('../../config/pricing_rules.json');

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

            // Hitung estimasi harga dengan parameter baru
            const nonTollEstimate = needNonToll ? this.calculatePrice(nonTollDistance, false, 'Jakarta', 'Default', false) : null;
            const tollEstimate = needToll ? this.calculatePrice(tollDistance, true, 'Jakarta', 'Default', false) : null;

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
                        is_toll: false,
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

    private calculatePrice(distanceKm: number, includeToll: boolean, origin: string = 'Jakarta', destination: string = 'Default', isPromo: boolean = false): {
        basePrice: number;
        tollFee: number;
        totalPrice: number;
        category: 'FTL Lokal' | 'FTL Antar Kota' | 'Promo';
    } {
        // 1. Cek promo terlebih dahulu jika isPromo === true
        if (isPromo) {
            const promoResult = this.calculatePromoPrice(origin, destination);
            if (promoResult) {
                this.logger.log(`Promo calculation - Origin: ${origin}, Destination: ${destination}, Price: ${promoResult.totalPrice}, Category: ${promoResult.category}`);
                return promoResult;
            }
        }

        // 2. Pilih rule berdasarkan jarak
        if (distanceKm <= 100) {
            // Gunakan FTL_Lokal untuk jarak <= 100 km
            return this.calculateLocalFTL(distanceKm, includeToll);
        } else {
            // Gunakan FTL_AntarKota untuk jarak > 100 km
            return this.calculateInterCityFTL(origin, destination, distanceKm, includeToll);
        }
    }

    /**
     * Hitung harga promo
     */
    private calculatePromoPrice(origin: string, destination: string): { basePrice: number; tollFee: number; totalPrice: number; category: 'Promo' } | null {
        const promo = pricingRules.FTL_Promo.routes.find(
            (r: any) => r.origin === origin && r.destination === destination
        );

        if (promo) {
            return {
                basePrice: promo.price,
                tollFee: 0,
                totalPrice: promo.price,
                category: 'Promo'
            };
        }

        return null;
    }

    /**
     * Hitung harga FTL lokal berdasarkan area
     */
    private calculateLocalFTL(distanceKm: number, includeToll: boolean): { basePrice: number; tollFee: number; totalPrice: number; category: 'FTL Lokal' } {
        const rule = pricingRules.FTL_Lokal;
        let areaPrice = rule.min_charge;
        let selectedArea: any = null;

        // Cari area yang sesuai dengan jarak
        for (const area of rule.areas) {
            const distanceRange = area.distance_km;
            if (this.isDistanceInRange(distanceKm, distanceRange)) {
                areaPrice = area.price;
                selectedArea = area;
                break;
            }
        }

        // Hitung toll fee jika diperlukan
        const tollFee = includeToll ? this.estimateSimpleTollFee(distanceKm) : 0;
        const totalPrice = areaPrice + tollFee;

        this.logger.log(`FTL Lokal calculation - Distance: ${distanceKm}km, Area: ${selectedArea ? selectedArea.name : 'Default'}, AreaPrice: ${areaPrice}, TollFee: ${tollFee}, Total: ${totalPrice}`);

        return {
            basePrice: areaPrice,
            tollFee,
            totalPrice,
            category: 'FTL Lokal'
        };
    }

    /**
     * Hitung harga FTL antar kota
     */
    private calculateInterCityFTL(origin: string, destination: string, distanceKm: number, includeToll: boolean): { basePrice: number; tollFee: number; totalPrice: number; category: 'FTL Antar Kota' } {
        const rule = pricingRules.FTL_AntarKota;

        // Hitung komponen harga sesuai rumus
        const baseFee = rule.base_fee;
        const linearFare = rule.rate_per_km * distanceKm;

        // Cari toll fee berdasarkan rute
        const tollKey = `${origin}-${destination}`;
        const ruleTollFee = rule.toll_fee[tollKey] || 0;

        // Gunakan toll fee dari rule jika ada, atau estimasi sederhana jika includeToll = true
        let tollFee = 0;
        if (ruleTollFee > 0) {
            tollFee = ruleTollFee;
        } else if (includeToll) {
            tollFee = this.estimateSimpleTollFee(distanceKm);
        }

        // Estimasi hari berdasarkan jarak (600km/hari)
        const estDays = Math.ceil(distanceKm / 600);
        const allowanceFee = rule.allowance_per_day * estDays;

        // Hitung subtotal sebelum diskon
        const subtotal = baseFee + linearFare + tollFee + allowanceFee;

        // Hitung diskon
        const discount = subtotal * rule.discount;

        // Total akhir setelah diskon
        const totalPrice = subtotal - discount;

        this.logger.log(`FTL Antar Kota calculation - Origin: ${origin}, Destination: ${destination}, Distance: ${distanceKm}km, BaseFee: ${baseFee}, LinearFare: ${linearFare}, TollFee: ${tollFee}, AllowanceFee: ${allowanceFee} (${estDays} days), Subtotal: ${subtotal}, Discount: ${discount}, Total: ${totalPrice}`);

        return {
            basePrice: subtotal,
            tollFee,
            totalPrice,
            category: 'FTL Antar Kota'
        };
    }

    /**
     * Cek apakah jarak masuk dalam range
     */
    private isDistanceInRange(distance: number, range: string): boolean {
        if (range.includes('<=')) {
            const maxDistance = parseInt(range.replace('<=', ''));
            return distance <= maxDistance;
        } else if (range.includes('-')) {
            const [min, max] = range.split('-').map(n => parseInt(n));
            return distance >= min && distance <= max;
        }
        return false;
    }

    /**
     * Estimasi biaya tol sederhana
     */
    private estimateSimpleTollFee(distanceKm: number): number {
        // Estimasi sederhana: Rp 500 per km untuk rute tol
        return Math.round(distanceKm * 500);
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

    async getCostBreakdown(query: CostBreakdownDto): Promise<CostBreakdownResponseDto> {
        try {
            const { origin_hub_code, dest_hub_code, distance_km, truck_type } = query;

            // Validasi jarak
            if (distance_km <= 0) {
                throw new Error('Jarak harus lebih dari 0 KM');
            }

            // Simulasi data biaya operasional dari database
            // Dalam implementasi nyata, ini akan diambil dari tabel truck_cost_routes
            const costData = this.getCostDataFromDatabase(origin_hub_code, dest_hub_code, distance_km, truck_type);

            if (!costData) {
                throw new NotFoundException('Data biaya operasional tidak ditemukan untuk rute ini');
            }

            const { uang_jalan_full, cost_driver_1, cost_driver_2, hub_asal, hub_tujuan } = costData;

            // Hitung breakdown persentase
            const uang_jalan_90_percent = Math.round(uang_jalan_full * 0.90);
            const uang_jalan_10_percent = Math.round(uang_jalan_full * 0.10);

            return {
                message: 'Rincian biaya operasional sewa truk berhasil diambil',
                data: {
                    asal: hub_asal,
                    tujuan: hub_tujuan,
                    keterangan: 'Perhitungan ini adalah biaya operasional bersih di luar biaya tol dan feri.',
                    rincian_biaya: {
                        jarak_km: distance_km,
                        uang_jalan_full,
                        uang_jalan_90_percent,
                        uang_jalan_10_percent,
                        cost_driver_1,
                        cost_driver_2
                    },
                }
            };

        } catch (error) {
            this.logger.error('Error getting cost breakdown:', error);
            throw error;
        }
    }

    /**
     * Simulasi pengambilan data biaya dari database
     * Dalam implementasi nyata, ini akan melakukan query ke tabel truck_cost_routes
     */
    private getCostDataFromDatabase(originHubCode: string, destHubCode: string, distanceKm: number, truckType: string) {
        // Simulasi data biaya berdasarkan contoh yang diberikan
        // Dalam implementasi nyata, gunakan query seperti:
        // SELECT * FROM truck_cost_routes 
        // WHERE origin_hub = ? AND dest_hub = ? AND distance_range_min <= ? AND distance_range_max >= ?

        const hubNames = {
            'JKT': 'Hub Jakarta Pusat',
            'BDG': 'Hub Bandung Timur',
            'SUB': 'Hub Surabaya Barat',
            'KNO': 'Medan',
            'BTH': 'Batam',
            'PKU': 'Pekanbaru',
            'DJB': 'Jambi',
            'PLB': 'Palembang',
            'TGR': 'Tangerang'
        };

        // Contoh data biaya untuk jarak 800km (seperti di spesifikasi)
        if (distanceKm >= 800 && distanceKm <= 900) {
            return {
                uang_jalan_full: 3121500, // IDR 3,121,500
                cost_driver_1: 678000,
                cost_driver_2: 452000,
                hub_asal: hubNames[originHubCode] || originHubCode,
                hub_tujuan: hubNames[destHubCode] || destHubCode
            };
        }

        // Fallback untuk jarak lain (dengan perhitungan sederhana)
        const baseRatePerKm = truckType === 'Fuso' ? 3500 : 3000;
        const baseUangJalan = Math.max(distanceKm * baseRatePerKm, 1000000); // Minimum 1 juta

        return {
            uang_jalan_full: baseUangJalan,
            cost_driver_1: Math.round(baseUangJalan * 0.22), // ~22% dari uang jalan
            cost_driver_2: Math.round(baseUangJalan * 0.15), // ~15% dari uang jalan
            hub_asal: hubNames[originHubCode] || originHubCode,
            hub_tujuan: hubNames[destHubCode] || destHubCode
        };
    }

    /**
     * Method public untuk test calculatePrice
     */
    async testCalculatePrice(distanceKm: number, includeToll: boolean, origin: string, destination: string, isPromo: boolean): Promise<any> {
        const result = this.calculatePrice(distanceKm, includeToll, origin, destination, isPromo);

        return {
            origin,
            destination,
            distance_km: distanceKm,
            include_toll: includeToll,
            is_promo: isPromo,
            category: result.category,
            base_price: this.formatRupiah(result.basePrice),
            toll_fee: this.formatRupiah(result.tollFee),
            total_price: this.formatRupiah(result.totalPrice),
            breakdown: {
                base_price_numeric: result.basePrice,
                toll_fee_numeric: result.tollFee,
                total_price_numeric: result.totalPrice
            }
        };
    }
}
