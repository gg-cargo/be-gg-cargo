import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
    constructor(private readonly geocodingService: GeocodingService) { }

    @Get('reverse')
    async reverseGeocoding(
        @Query('lat') lat: string,
        @Query('lon') lon: string,
    ) {
        // Validasi parameter lat
        if (!lat || lat.trim() === '') {
            throw new HttpException(
                'Parameter lat (latitude) wajib diisi',
                HttpStatus.BAD_REQUEST
            );
        }

        // Validasi parameter lon
        if (!lon || lon.trim() === '') {
            throw new HttpException(
                'Parameter lon (longitude) wajib diisi',
                HttpStatus.BAD_REQUEST
            );
        }

        // Validasi format koordinat
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (isNaN(latNum) || isNaN(lonNum)) {
            throw new HttpException(
                'Parameter lat dan lon harus berupa angka',
                HttpStatus.BAD_REQUEST
            );
        }

        // Validasi range koordinat
        if (latNum < -90 || latNum > 90) {
            throw new HttpException(
                'Latitude harus berada dalam range -90 hingga 90',
                HttpStatus.BAD_REQUEST
            );
        }

        if (lonNum < -180 || lonNum > 180) {
            throw new HttpException(
                'Longitude harus berada dalam range -180 hingga 180',
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            return await this.geocodingService.reverseGeocoding(latNum, lonNum);
        } catch (error) {
            throw new HttpException(
                error.message || 'Terjadi kesalahan saat melakukan reverse geocoding',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('search')
    async searchGeocoding(
        @Query('q') query: string,
    ) {
        // Validasi parameter q
        if (!query || query.trim() === '') {
            throw new HttpException(
                'Parameter q (query) wajib diisi',
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            return await this.geocodingService.searchGeocoding(query.trim());
        } catch (error) {
            throw new HttpException(
                error.message || 'Terjadi kesalahan saat melakukan pencarian geocoding',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
