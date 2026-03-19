import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    BypassInboundBulkDto,
    BypassInboundBulkResponseDto,
    BypassInboundDto,
    BypassInboundResponseDto,
} from './dto/bypass-inbound.dto';
import { OrdersService } from './orders.service';

@Controller('inbound')
export class InboundController {
    constructor(private readonly ordersService: OrdersService) {}

    @UseGuards(JwtAuthGuard)
    @Post('bypass-receive')
    @HttpCode(HttpStatus.OK)
    async bypassReceive(@Body() dto: BypassInboundDto): Promise<BypassInboundResponseDto> {
        return this.ordersService.bypassInboundReceive(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('bypass-receive/bulk')
    @HttpCode(HttpStatus.OK)
    async bypassReceiveBulk(
        @Body() dto: BypassInboundBulkDto,
    ): Promise<BypassInboundBulkResponseDto> {
        return this.ordersService.bypassInboundReceiveBulk(dto);
    }
}
