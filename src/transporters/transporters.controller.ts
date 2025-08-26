import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransportersService } from './transporters.service';
import { AvailableTransportersQueryDto, AvailableTransportersResponseDto } from './dto/available-transporters.dto';

@Controller('transporters')
export class TransportersController {
    constructor(private readonly transportersService: TransportersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('available')
    async getAvailableTransporters(
        @Query() query: AvailableTransportersQueryDto,
    ): Promise<{ message: string; data: AvailableTransportersResponseDto }> {
        const result = await this.transportersService.getAvailableTransporters(query);
        return {
            message: 'Berhasil mengambil daftar transporter tersedia',
            data: result,
        };
    }
}


