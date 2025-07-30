import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { AvailableDriversDto } from './dto/available-drivers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    @UseGuards(JwtAuthGuard)
    @Get('available')
    async getAvailableDrivers(@Query() query: AvailableDriversDto) {
        return this.driversService.getAvailableDrivers(query);
    }
} 