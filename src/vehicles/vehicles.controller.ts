import { Controller, Get, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesQueryDto, VehiclesResponseDto } from './dto/vehicles.dto';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @Get()
    async getVehicles(@Query() query: VehiclesQueryDto): Promise<VehiclesResponseDto> {
        return this.vehiclesService.getVehicles(query);
    }
}
