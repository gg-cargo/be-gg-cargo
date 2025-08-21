import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, Param, ParseIntPipe, Req, Get, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { File } from 'multer';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderResponseDto } from './dto/order-response.dto';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { ReweightPieceDto } from './dto/reweight-piece.dto';
import { ReweightPieceResponseDto } from './dto/reweight-response.dto';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { BypassReweightDto } from './dto/bypass-reweight.dto';
import { BypassReweightResponseDto } from './dto/bypass-reweight-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { DeleteOrderDto } from './dto/delete-order.dto';
import { DeleteOrderResponseDto } from './dto/delete-order-response.dto';

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

    @Patch(':no_resi/cancel')
    @UseGuards(JwtAuthGuard)
    async cancelOrder(@Param('no_resi') noResi: string, @Body() body: CancelOrderDto) {
        return this.ordersService.cancelOrder(noResi, body);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('pieces/:id/reweight')
    async reweightPiece(
        @Param('id', ParseIntPipe) pieceId: number,
        @Body() reweightDto: ReweightPieceDto,
    ): Promise<ReweightPieceResponseDto> {
        return this.ordersService.reweightPiece(pieceId, reweightDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':order_id/bypass-reweight')
    @UseInterceptors(FileInterceptor('proof_image', {
        storage: diskStorage({
            destination: 'public/uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
    }))
    async bypassReweight(
        @Param('order_id', ParseIntPipe) orderId: number,
        @Body() bypassDto: BypassReweightDto,
        @UploadedFile() proofImage: File,
    ): Promise<BypassReweightResponseDto> {
        // Gabungkan file dengan DTO
        const bypassData = {
            ...bypassDto,
            proof_image: proofImage
        };

        return this.ordersService.bypassReweight(orderId, bypassData);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':no_resi')
    async getOrderDetail(
        @Param('no_resi') noResi: string,
    ): Promise<OrderDetailResponseDto> {
        return this.ordersService.getOrderDetail(noResi);
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

    @UseGuards(JwtAuthGuard)
    @Delete(':no_resi')
    async deleteOrder(
        @Param('no_resi') noResi: string,
        @Body() deleteDto: DeleteOrderDto,
    ): Promise<DeleteOrderResponseDto> {
        return this.ordersService.deleteOrder(noResi, deleteDto);
    }
} 