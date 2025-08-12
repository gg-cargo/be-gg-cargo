import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateVaDto, CreateVaResponseDto, MidtransNotificationDto } from './dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('midtrans/va')
    @HttpCode(HttpStatus.CREATED)
    async createVa(@Body() createVaDto: CreateVaDto): Promise<CreateVaResponseDto> {
        return this.paymentsService.createVa(createVaDto);
    }

    @Post('midtrans/notification')
    @HttpCode(HttpStatus.OK)
    async handleMidtransNotification(@Body() notification: MidtransNotificationDto): Promise<{ message: string }> {
        return this.paymentsService.handleMidtransNotification(notification);
    }
}
