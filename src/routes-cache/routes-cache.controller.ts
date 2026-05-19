import { Controller, Get, Query } from '@nestjs/common';
import { RoutesCacheService } from './routes-cache.service';
import { TollEstimateQueryDto } from './dto/toll-estimate-query.dto';
import { TollEstimateResponseDto } from './dto/toll-estimate-response.dto';

@Controller('routes-cache')
export class RoutesCacheController {
  constructor(private readonly routesCacheService: RoutesCacheService) {}

  /**
   * Cek estimasi biaya tol via Google Routes API (cache-first).
   * GET /routes-cache/toll-estimate?origin_latlng=-6.2088,106.8456&destination_latlng=-6.9175,107.6191
   */
  @Get('toll-estimate')
  async getTollEstimate(
    @Query() query: TollEstimateQueryDto,
  ): Promise<TollEstimateResponseDto> {
    return this.routesCacheService.getTollEstimate(
      query.origin_latlng,
      query.destination_latlng,
    );
  }
}
