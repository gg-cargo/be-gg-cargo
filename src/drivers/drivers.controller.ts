import { Controller, Get, Query, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { AvailableDriversDto, AvailableDriversForPickupDto } from './dto/available-drivers.dto';
import { DriverStatusSummaryQueryDto } from './dto/driver-status-summary.dto';
import { AssignDriverDto, AssignDriverResponseDto } from './dto/assign-driver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    @UseGuards(JwtAuthGuard)
    @Get('available')
    async getAvailableDrivers(@Query() query: AvailableDriversDto) {
        return this.driversService.getAvailableDrivers(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('status/summary')
    async getDriverStatusSummary(@Query() query: DriverStatusSummaryQueryDto) {
        return this.driversService.getDriverStatusSummary(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('available-for-pickup')
    async getAvailableDriversForPickup(@Query() query: AvailableDriversForPickupDto) {
        return this.driversService.getAvailableDriversForPickup(query);
    }

    @UseGuards(JwtAuthGuard)
    @Post('assign-driver')
    async assignDriverToOrder(
        @Body() assignDriverDto: AssignDriverDto,
        @Request() req: any
    ): Promise<AssignDriverResponseDto> {
        // Override assigned_by_user_id dengan user yang sedang login
        assignDriverDto.assigned_by_user_id = req.user?.id;
        return this.driversService.assignDriverToOrder(assignDriverDto);
    }
} 