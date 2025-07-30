import { Controller, Get, Post, Patch, Query, Body, Param, HttpException, HttpStatus, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PickupsService } from './pickups.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { ReschedulePickupDto } from './dto/reschedule-pickup.dto';
import { ConfirmPickupDto } from './dto/confirm-pickup.dto';
import { PickupSummaryDto } from './dto/pickup-summary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pickups')
export class PickupsController {
    constructor(private readonly pickupsService: PickupsService) { }

    @Get('queue')
    async getPickupQueue(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('hub_id') hub_id?: string,
        @Query('svc_source_id') svc_source_id?: string,
        @Query('status_pickup') status_pickup?: string,
        @Query('priority') priority?: string,
        @Query('search') search?: string,
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
        @Query('sort_by') sort_by?: string,
        @Query('sort_order') sort_order?: string,
    ) {
        const pageNumber = parseInt(page || '1') || 1;
        const limitNumber = parseInt(limit || '20') || 20;

        if (pageNumber < 1) {
            throw new HttpException('Page harus lebih dari 0', HttpStatus.BAD_REQUEST);
        }

        if (limitNumber < 1 || limitNumber > 100) {
            throw new HttpException('Limit harus antara 1-100', HttpStatus.BAD_REQUEST);
        }

        return this.pickupsService.getPickupQueue({
            page: pageNumber,
            limit: limitNumber,
            hub_id: hub_id ? parseInt(hub_id) : undefined,
            svc_source_id: svc_source_id ? parseInt(svc_source_id) : undefined,
            status_pickup,
            priority: priority === 'true',
            search,
            date_from,
            date_to,
            sort_by: sort_by || 'created_at',
            sort_order: sort_order || 'DESC',
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('assign-driver')
    async assignDriver(@Body() assignDriverDto: AssignDriverDto) {
        return this.pickupsService.assignDriver(assignDriverDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('summary')
    async getPickupSummary(@Query() query: PickupSummaryDto) {
        return this.pickupsService.getPickupSummary(query);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('reschedule')
    async reschedulePickup(@Body() rescheduleDto: ReschedulePickupDto) {
        return this.pickupsService.reschedulePickup(rescheduleDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('confirm')
    async confirmPickup(@Body() confirmDto: ConfirmPickupDto) {
        return this.pickupsService.confirmPickup(confirmDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':order_id')
    async getPickupDetail(@Param('order_id', ParseIntPipe) orderId: number) {
        return this.pickupsService.getPickupDetail(orderId);
    }
} 