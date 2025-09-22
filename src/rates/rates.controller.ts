import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { RatesService } from './rates.service';

@Controller('rates')
export class RatesController {
    constructor(private readonly ratesService: RatesService) { }

    @Get('sewa-truk')
    async getTruckRentalRate(
        @Query('origin_latlng') originLatLng: string,
        @Query('destination_latlng') destinationLatLng: string,
    ) {
        // Validasi parameter yang diperlukan
        if (!originLatLng || !destinationLatLng) {
            throw new HttpException(
                'Parameter origin_latlng dan destination_latlng harus diisi',
                HttpStatus.BAD_REQUEST
            );
        }

        // Validasi format koordinat (format: lat,lng)
        const coordinateRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

        if (!coordinateRegex.test(originLatLng) || !coordinateRegex.test(destinationLatLng)) {
            throw new HttpException(
                'Format koordinat tidak valid. Gunakan format: lat,lng (contoh: -6.2088,106.8456)',
                HttpStatus.BAD_REQUEST
            );
        }

        // Validasi range koordinat
        try {
            const [originLat, originLng] = originLatLng.split(',').map(coord => parseFloat(coord.trim()));
            const [destLat, destLng] = destinationLatLng.split(',').map(coord => parseFloat(coord.trim()));

            // Validasi latitude (-90 sampai 90)
            if (originLat < -90 || originLat > 90 || destLat < -90 || destLat > 90) {
                throw new HttpException(
                    'Latitude harus antara -90 dan 90',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Validasi longitude (-180 sampai 180)
            if (originLng < -180 || originLng > 180 || destLng < -180 || destLng > 180) {
                throw new HttpException(
                    'Longitude harus antara -180 dan 180',
                    HttpStatus.BAD_REQUEST
                );
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Format koordinat tidak valid',
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            return await this.ratesService.calculateTruckRentalRate(originLatLng, destinationLatLng);
        } catch (error) {
            throw new HttpException(
                error.message || 'Terjadi kesalahan saat menghitung estimasi harga',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
