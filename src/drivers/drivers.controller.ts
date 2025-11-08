import { Controller, Get, Query, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { AvailableDriversDto, AvailableDriversForPickupDto, AvailableDriversForDeliverDto } from './dto/available-drivers.dto';
import { DriverStatusSummaryQueryDto } from './dto/driver-status-summary.dto';
import { AssignDriverDto, AssignDriverResponseDto } from './dto/assign-driver.dto';
import { MyTasksQueryDto, MyTasksResponseDto } from './dto/my-tasks.dto';
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
    async getDriverStatusSummary(@Query() query: DriverStatusSummaryQueryDto, @Request() req: any) {
        // Ambil hub_id dari user yang sedang login
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User tidak terautentikasi');
        }

        return this.driversService.getDriverStatusSummary(query, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('available-for-pickup')
    async getAvailableDriversForPickup(@Query() query: AvailableDriversForPickupDto) {
        // Fallback hub_id jika tidak dikirim: ambil dari order.hub_source_id atau 1
        if (!query.hub_id) {
            try {
                const fallbackHubId = await this.driversService.getOrderHubFallback(query.order_id);
                query.hub_id = fallbackHubId ?? 1;
            } catch (_) {
                query.hub_id = 1;
            }
        }
        return this.driversService.getAvailableDriversForPickup(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('available-for-deliver')
    async getAvailableDriversForDeliver(@Query() query: AvailableDriversForDeliverDto) {
        // Fallback hub_id jika tidak dikirim: ambil dari order.hub_dest_id atau 1
        if (!query.hub_id) {
            try {
                const fallbackHubId = await this.driversService.getOrderHubDestFallback(query.order_id);
                query.hub_id = fallbackHubId ?? 1;
            } catch (_) {
                query.hub_id = 1;
            }
        }
        return this.driversService.getAvailableDriversForDeliver(query);
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

    @UseGuards(JwtAuthGuard)
    @Get('my-tasks')
    async getMyTasks(
        @Query() query: MyTasksQueryDto,
        @Request() req: any
    ): Promise<MyTasksResponseDto> {
        const driverId = req.user?.id;
        if (!driverId) {
            throw new UnauthorizedException('User tidak terautentikasi');
        }

        return this.driversService.getMyTasks(driverId, query);
    }
} 