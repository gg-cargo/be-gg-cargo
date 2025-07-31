import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceSummaryDto } from './dto/finance-summary.dto';
import { FinanceShipmentsDto } from './dto/finance-shipments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
} 