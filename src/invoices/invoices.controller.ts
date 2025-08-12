import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { SendEmailDto, SendEmailResponseDto, GetInvoiceByTrackingResponseDto } from './dto';

@Controller('invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Post('send-email')
    @HttpCode(HttpStatus.OK)
    async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<SendEmailResponseDto> {
        return this.invoicesService.sendEmail(sendEmailDto);
    }

    @Get(':no_tracking')
    async getInvoiceByTracking(@Param('no_tracking') noTracking: string): Promise<GetInvoiceByTrackingResponseDto> {
        return this.invoicesService.getInvoiceByTracking(noTracking);
    }
}

