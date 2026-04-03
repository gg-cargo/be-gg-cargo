import { Controller, Get, Query, HttpException, HttpStatus, Patch, Body } from '@nestjs/common';
import { CityService } from './city.service';
import { BulkAssignHubOriginDto } from './dto/bulk-assign-hub-origin.dto';

@Controller('city')
export class CityController {
    constructor(private readonly cityService: CityService) { }

    @Patch('hub-origin/bulk')
    async bulkAssignHubOrigin(@Body() payload: BulkAssignHubOriginDto) {
        return this.cityService.bulkAssignHubOrigin(payload);
    }

    @Get('search')
    async searchCity(
        @Query('q') query?: string,
        @Query('origin') origin?: string,
        @Query('destination') destination?: string,
        @Query('city') city?: string,
        @Query('provinsi') provinsi?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedPage = page ? Number(page) : 1;
        const parsedLimit = limit ? Number(limit) : 20;

        if (!Number.isInteger(parsedPage) || parsedPage < 1) {
            throw new HttpException('Parameter page harus berupa angka bulat >= 1', HttpStatus.BAD_REQUEST);
        }

        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            throw new HttpException('Parameter limit harus berupa angka bulat antara 1 sampai 100', HttpStatus.BAD_REQUEST);
        }

        const trimmedQuery = query?.trim();
        const trimmedCity = city?.trim();
        const trimmedProvinsi = provinsi?.trim();

        if (trimmedQuery && trimmedQuery.length < 2) {
            throw new HttpException('Query minimal 2 karakter', HttpStatus.BAD_REQUEST);
        }

        return this.cityService.searchCity(trimmedQuery, origin, destination, trimmedCity, trimmedProvinsi, parsedPage, parsedLimit);
    }
} 