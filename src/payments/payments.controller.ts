import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateVaDto, CreateVaResponseDto, MidtransNotificationDto, PaymentStatusResponseDto } from './dto';

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
        // Debug logging untuk melihat data yang masuk
        console.log('=== MIDTRANS NOTIFICATION RECEIVED ===');
        console.log('Raw notification object:', notification);
        console.log('Notification type:', typeof notification);
        console.log('Notification keys:', Object.keys(notification));
        console.log('Order ID:', notification?.order_id);
        console.log('Transaction ID:', notification?.transaction_id);
        console.log('Status Code:', notification?.status_code);
        console.log('Gross Amount:', notification?.gross_amount);
        console.log('Signature Key:', notification?.signature_key);
        console.log('VA Numbers:', notification?.va_numbers);
        console.log('=====================================');

        return this.paymentsService.handleMidtransNotification(notification);
    }

    @Get(':no_tracking/status')
    @HttpCode(HttpStatus.OK)
    async getPaymentStatus(@Param('no_tracking') noTracking: string): Promise<PaymentStatusResponseDto> {
        return this.paymentsService.getPaymentStatus(noTracking);
    }
}
