import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, Param, ParseIntPipe, Req, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @Request() req: any,
    ): Promise<CreateOrderResponseDto> {
        // Ambil user ID dari request (asumsikan sudah ada middleware auth)
        const userId = req.user?.id || 1; // Fallback ke 1 jika belum ada auth

        return this.ordersService.createOrder(createOrderDto, userId);
    }

    @Post(':id/referensi')
    async createResiReferensi(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.createResiReferensi(id);
    }

    @Post(':id/history')
    async addOrderHistory(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateOrderHistoryDto,
    ) {
        return this.ordersService.addOrderHistory(id, dto);
    }

    @Get()
    async listOrders(@Req() req) {
        // Asumsi user login ada di req.user.id
        return this.ordersService.listOrders(req.user.id);
    }

    @Get('statistics')
    async getDashboardStatistics(@Req() req) {
        return this.ordersService.getDashboardStatistics(req.user.id);
    }

    @Get('export/excel')
    async exportToExcel(@Req() req) {
        return this.ordersService.exportToExcel(req.user.id);
    }

    @Get(':id/reorder')
    async getReorderData(
        @Param('id', ParseIntPipe) id: number,
        @Req() req
    ) {
        return this.ordersService.getReorderData(id, req.user.id);
    }

    @Get(':id/history')
    async getOrderHistory(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.getOrderHistoryByOrderId(id);
    }
} 