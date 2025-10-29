import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RatesService } from './rates.service';
import { CostBreakdownDto } from './dto/cost-breakdown.dto';

@Controller('rates')
export class RatesController {
    private readonly logger = new Logger(RatesController.name);

    constructor(private readonly ratesService: RatesService) { }

    @Get('sewa-truk')
    async getTruckRentalRate(
        @Query('origin_latlng') originLatLng: string,
        @Query('destination_latlng') destinationLatLng: string,
        @Query('is_toll') isToll?: string,
        @Query('truck_type') truckType?: string,
        @Query('need_jasa_bongkar') needJasaBongkar?: string,
        @Query('num_helpers') numHelpers?: string,
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

        // Validasi parameter is_toll
        let tollFilter: boolean | undefined;
        if (isToll !== undefined && isToll !== null && isToll !== '') {
            if (isToll.toLowerCase() === 'true') {
                tollFilter = true;
            } else if (isToll.toLowerCase() === 'false') {
                tollFilter = false;
            } else {
                throw new HttpException(
                    'Parameter is_toll harus berupa boolean (true atau false)',
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        // Parse jasa bongkar parameters
        const needJasaBongkarBool = needJasaBongkar === 'true';
        const numHelpersInt = numHelpers ? parseInt(numHelpers, 10) : undefined;

        try {
            return await this.ratesService.calculateTruckRentalRate(originLatLng, destinationLatLng, tollFilter, truckType, needJasaBongkarBool, numHelpersInt);
        } catch (error) {
            throw new HttpException(
                error.message || 'Terjadi kesalahan saat menghitung estimasi harga',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('sewa-truk/cost-breakdown')
    async getCostBreakdown(
        @Query() query: CostBreakdownDto,
    ) {
        try {
            return await this.ratesService.getCostBreakdown(query);
        } catch (error) {
            throw new HttpException(
                error.message || 'Terjadi kesalahan saat mengambil rincian biaya',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('test-pricing')
    async testPricing(
        @Query('distance_km') distanceKm: string = '25',
        @Query('truck_type') truckType?: string,
    ) {
        try {
            // Validasi dan konversi parameter
            const distanceKmNumber = parseFloat(distanceKm);
            if (isNaN(distanceKmNumber) || distanceKmNumber < 0) {
                throw new HttpException(
                    'Parameter distance_km harus berupa angka positif',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Panggil method public untuk test
            const result = await this.ratesService.testCalculatePrice(distanceKmNumber, truckType);

            return {
                message: 'Test pricing berhasil',
                data: result
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error('Error testing pricing:', error);
            throw new HttpException(
                'Gagal test pricing',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
