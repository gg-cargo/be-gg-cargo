import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, Param, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';

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
} 