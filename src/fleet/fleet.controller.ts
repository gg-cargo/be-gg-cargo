import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FleetService } from './fleet.service';
import { FleetShipmentsQueryDto, FleetShipmentsResponseDto } from './dto/fleet-shipments.dto';

@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  /**
   * GET /api/fleet/shipments
   *
   * Endpoint utama untuk dashboard Fleet menampilkan daftar shipment / resi.
   */
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
}

