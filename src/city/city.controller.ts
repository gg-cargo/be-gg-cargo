import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { CityService } from './city.service';

@Controller('city')
export class CityController {
    constructor(private readonly cityService: CityService) { }

    @Get('search')
    async searchCity(
        @Query('q') query: string,
        @Query('origin') origin?: string,
        @Query('destination') destination?: string,
    ) {
        if (!query || query.trim().length === 0) {
            throw new HttpException('Parameter query (q) harus diisi', HttpStatus.BAD_REQUEST);
        }

        if (query.trim().length < 2) {
            throw new HttpException('Query minimal 2 karakter', HttpStatus.BAD_REQUEST);
        }

        return this.cityService.searchCity(query.trim(), origin, destination);
    }
} 