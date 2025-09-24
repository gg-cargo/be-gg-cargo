import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);

    async reverseGeocoding(lat: number, lon: number) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

            this.logger.log(`Calling Nominatim reverse geocoding API: ${url}`);

            const response = await axios.get(url, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'GG-Kargo-BE/1.0'
                }
            });

            if (!response.data) {
                throw new Error('Tidak ada data yang ditemukan untuk koordinat yang diberikan');
            }

            this.logger.log('Successfully retrieved address from Nominatim API');

            return {
                message: 'Alamat berhasil ditemukan',
                data: response.data
            };

        } catch (error) {
            this.logger.error('Error in reverse geocoding:', error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new Error('Alamat tidak ditemukan untuk koordinat yang diberikan');
                } else if (error.response?.status === 429) {
                    throw new Error('Terlalu banyak permintaan. Silakan coba lagi nanti');
                } else if (error.code === 'ECONNABORTED') {
                    throw new Error('Timeout saat menghubungi server geocoding');
                }
            }

            throw new Error(`Gagal mendapatkan alamat dari koordinat: ${error.message}`);
        }
    }

    async searchGeocoding(query: string) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=10`;

            this.logger.log(`Calling Nominatim search geocoding API: ${url}`);

            const response = await axios.get(url, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'GG-Kargo-BE/1.0'
                }
            });

            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Format response tidak valid');
            }

            this.logger.log(`Successfully retrieved ${response.data.length} results from Nominatim API`);

            return {
                message: `${response.data.length} lokasi ditemukan`,
                data: response.data
            };

        } catch (error) {
            this.logger.error('Error in search geocoding:', error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new Error('Tidak ada lokasi yang ditemukan untuk pencarian ini');
                } else if (error.response?.status === 429) {
                    throw new Error('Terlalu banyak permintaan. Silakan coba lagi nanti');
                } else if (error.code === 'ECONNABORTED') {
                    throw new Error('Timeout saat menghubungi server geocoding');
                }
            }

            throw new Error(`Gagal melakukan pencarian geocoding: ${error.message}`);
        }
    }
}
