import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateFleetEstimateApprovalDto } from './dto/update-fleet-estimate-approval.dto';
import { ListFleetEstimatesQueryDto } from './dto/list-fleet-estimates-query.dto';
import { ListFleetEstimatesResponseDto } from './dto/fleet-estimate-item.dto';
import { FleetEstimateResponseDto } from './dto/fleet-estimate-response.dto';
import { FleetTripService } from './fleet-trip.service';
import { FleetSaldoService } from './fleet-saldo.service';
import { CreditFleetDepositSaldoResponseDto } from './dto/credit-fleet-deposit-saldo-response.dto';
import { CreditFleetDepositSaldoDto } from './dto/credit-fleet-deposit-saldo.dto';
import { CreateFleetTripDto } from './dto/create-fleet-trip.dto';
import {
  FleetTripResponseDto,
  FleetTripListResponseDto,
  FleetTripLoadingPhotosResponseDto,
} from './dto/fleet-trip-response.dto';
import { ListFleetTripsQueryDto } from './dto/list-fleet-trips-query.dto';
import { UpdateFleetTripLoadingPhotosDto } from './dto/update-fleet-trip-loading-photos.dto';
import { UpdateFleetTripApproveStatusDto } from './dto/update-fleet-trip-approve-status.dto';

@Controller('fleet')
export class FleetController {
  constructor(
    private readonly fleetService: FleetService,
    private readonly fleetTripService: FleetTripService,
    private readonly fleetSaldoService: FleetSaldoService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('estimates')
  async listFleetEstimates(
    @Query() query: ListFleetEstimatesQueryDto,
  ): Promise<{ success: boolean; message: string; data: ListFleetEstimatesResponseDto }> {
    const data = await this.fleetService.listFleetEstimates(query);
    return {
      success: true,
      message: 'Daftar fleet estimate berhasil diambil',
      data,
    };
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
  @Patch('estimates/:id/approval-status')
  @HttpCode(HttpStatus.OK)
  async updateFleetEstimateApprovalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFleetEstimateApprovalDto,
    @Request() req: { user?: { id?: number } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.fleetService.updateFleetEstimateApprovalStatus(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('estimates/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFleetEstimate(@Param('id', ParseIntPipe) id: number) {
    return this.fleetService.deleteFleetEstimate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('trips')
  @HttpCode(HttpStatus.CREATED)
  async createFleetTrip(
    @Body() dto: CreateFleetTripDto,
    @Request() req: { user?: { id?: number } },
  ): Promise<FleetTripResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.fleetTripService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trips')
  async listFleetTrips(
    @Query() query: ListFleetTripsQueryDto,
  ): Promise<FleetTripListResponseDto> {
    return this.fleetTripService.list(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trips/:trackingNo/loading-photos')
  async getFleetTripLoadingPhotos(
    @Param('trackingNo') trackingNo: string,
  ): Promise<FleetTripLoadingPhotosResponseDto> {
    return this.fleetTripService.getLoadingPhotos(trackingNo);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('trips/:trackingNo/loading-photos')
  @HttpCode(HttpStatus.OK)
  async updateFleetTripLoadingPhotos(
    @Param('trackingNo') trackingNo: string,
    @Body() dto: UpdateFleetTripLoadingPhotosDto,
  ): Promise<FleetTripLoadingPhotosResponseDto> {
    return this.fleetTripService.updateLoadingPhotos(trackingNo, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('trips/:trackingNo/approve-status')
  @HttpCode(HttpStatus.OK)
  async updateFleetTripApproveStatus(
    @Param('trackingNo') trackingNo: string,
    @Body() dto: UpdateFleetTripApproveStatusDto,
    @Request() req: { user?: { id?: number } },
  ): Promise<FleetTripResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.fleetTripService.updateApproveStatus(trackingNo, dto, userId);
  }

  /**
   * Kredit deposit supir 1 & 2 ke saldo driver (tabel saldo). Mitra & vendor.
   * Trip vendor tanpa driver di assignment: kirim driver_1_user_id (dan opsional driver_2) di body.
   */
  @UseGuards(JwtAuthGuard)
  @Post('trips/:trackingNo/credit-deposit-saldo')
  @HttpCode(HttpStatus.OK)
  async creditFleetTripDepositSaldo(
    @Param('trackingNo') trackingNo: string,
    @Body() body: CreditFleetDepositSaldoDto,
    @Request() req: { user?: { id?: number } },
  ): Promise<CreditFleetDepositSaldoResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.fleetSaldoService.creditFleetTripDepositSaldo(trackingNo, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trips/:trackingNo')
  async getFleetTrip(
    @Param('trackingNo') trackingNo: string,
  ): Promise<FleetTripResponseDto> {
    return this.fleetTripService.findByTrackingNo(trackingNo);
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

