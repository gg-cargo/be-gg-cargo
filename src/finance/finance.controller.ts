import { Controller, Get, Query, UseGuards, Param, Body, Post, Patch } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceSummaryDto } from './dto/finance-summary.dto';
import { FinanceShipmentsDto } from './dto/finance-shipments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RevenueSummaryByServiceDto } from './dto/revenue-summary-by-service.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('dashboard/summary')
    async getFinanceSummary(@Query() query: FinanceSummaryDto) {
        return this.financeService.getFinanceSummary(query);
    }

    @Get('shipments')
    async getFinanceShipments(@Query() query: FinanceShipmentsDto) {
        return this.financeService.getFinanceShipments(query);
    }

    @Get('shipments/:no_resi/invoice')
    async getInvoiceByResi(@Param('no_resi') noResi: string) {
        return this.financeService.getInvoiceByResi(noResi);
    }

    @Get('shipments/:no_resi/invoice/pdf')
    async getInvoicePDFByResi(@Param('no_resi') noResi: string) {
        return this.financeService.getInvoicePDFByResi(noResi);
    }

    @Get('invoices/:invoice_no')
    async getInvoiceByInvoiceNo(@Param('invoice_no') invoiceNo: string) {
        return this.financeService.getInvoiceByInvoiceNo(invoiceNo);
    }

    @Post('invoices')
    async createInvoice(@Body() body: CreateInvoiceDto) {
        return this.financeService.createInvoice(body);
    }

    @Patch('invoices/:invoice_no')
    async updateInvoice(@Param('invoice_no') invoiceNo: string, @Body() body: UpdateInvoiceDto) {
        return this.financeService.updateInvoice(invoiceNo, body);
    }

    @Get('revenue/summary-by-service')
    async getRevenueSummaryByService(@Query() query: RevenueSummaryByServiceDto) {
        return this.financeService.getRevenueSummaryByService(query);
    }
} 