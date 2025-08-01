import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, Param, ParseIntPipe, Req, Get, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderResponseDto } from './dto/order-response.dto';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { ReweightPieceDto } from './dto/reweight-piece.dto';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @UseGuards(JwtAuthGuard)
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

    @UseGuards(JwtAuthGuard)
    @Post(':id/referensi')
    async createResiReferensi(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.createResiReferensi(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/history')
    async addOrderHistory(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateOrderHistoryDto,
    ) {
        return this.ordersService.addOrderHistory(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async listOrders(@Req() req) {
        // Asumsi user login ada di req.user.id
        return this.ordersService.listOrders(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('statistics')
    async getDashboardStatistics(@Req() req) {
        return this.ordersService.getDashboardStatistics(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('export/excel')
    async exportToExcel(@Req() req) {
        return this.ordersService.exportToExcel(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('export/pdf')
    async exportToPdf(@Req() req) {
        return this.ordersService.exportToPdf(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/reorder')
    async getReorderData(
        @Param('id', ParseIntPipe) id: number,
        @Req() req
    ) {
        return this.ordersService.getReorderData(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/history')
    async getOrderHistory(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.getOrderHistoryByOrderId(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    async cancelOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.ordersService.cancelOrder(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('pieces/:id/reweight')
    async reweightPiece(
        @Param('id', ParseIntPipe) pieceId: number,
        @Body() reweightDto: ReweightPieceDto,
    ) {
        return this.ordersService.reweightPiece(pieceId, reweightDto);
    }

    @Post('estimate-price')
    async estimatePrice(@Body() estimateDto: EstimatePriceDto) {
        return this.ordersService.estimatePrice(estimateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_resi')
    async updateOrder(
        @Param('no_resi') noResi: string,
        @Body() updateOrderDto: UpdateOrderDto
    ): Promise<UpdateOrderResponseDto> {
        return this.ordersService.updateOrder(noResi, updateOrderDto);
    }
} 