import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FleetService } from './fleet.service';
import { FleetShipmentsQueryDto, FleetShipmentsResponseDto } from './dto/fleet-shipments.dto';
import { FleetDashboardSummaryResponseDto } from './dto/fleet-dashboard-summary.dto';
import { FleetEstimateDto } from './dto/fleet-estimate.dto';
import { CreateFleetEstimateDto } from './dto/create-fleet-estimate.dto';
import { FleetEstimateResponseDto } from './dto/fleet-estimate-response.dto';

@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) { }

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
  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  async estimateOperationalCost(
    @Body() dto: FleetEstimateDto,
    @Request() req: { user?: { id?: number } },
  ): Promise<FleetEstimateResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.fleetService.estimateOperationalCost(dto, userId);
  }

  /**
   * Simpan estimasi ke tabel fleet_estimates (status pending).
   */
  @UseGuards(JwtAuthGuard)
  @Post('estimates')
  @HttpCode(HttpStatus.CREATED)
  async createFleetEstimate(
    @Body() dto: CreateFleetEstimateDto,
    @Request() req: { user?: { id?: number } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.fleetService.createFleetEstimate(dto, userId);
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

