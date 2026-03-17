import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FleetService } from './fleet.service';
import { FleetShipmentsQueryDto, FleetShipmentsResponseDto } from './dto/fleet-shipments.dto';
import { FleetDashboardSummaryResponseDto } from './dto/fleet-dashboard-summary.dto';

@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @UseGuards(JwtAuthGuard)
  @Get('shipments')
  async getShipments(
    @Query() query: FleetShipmentsQueryDto,
  ): Promise<{ message: string; data: FleetShipmentsResponseDto }> {
    const result = await this.fleetService.getShipments(query);
    return {
      message: 'Fleet shipments fetched successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard-summary')
  async getDashboardSummary(): Promise<{
    message: string;
    data: FleetDashboardSummaryResponseDto;
  }> {
    const result = await this.fleetService.getDashboardSummary();
    return {
      message: 'Fleet dashboard summary fetched successfully',
      data: result,
    };
  }
}

