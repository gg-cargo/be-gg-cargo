import { Controller, Get, Param } from '@nestjs/common';
import { TrackingsService } from './trackings.service';

@Controller('trackings')
export class TrackingsController {
    constructor(private readonly trackingsService: TrackingsService) { }

    @Get(':no_resi')
    async getTrackingByResi(@Param('no_resi') noResi: string) {
        return this.trackingsService.getTrackingByResi(noResi);
    }
} 