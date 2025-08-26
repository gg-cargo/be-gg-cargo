import { Controller, Get, Query } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { HubListQueryDto, HubListResponseDto } from './dto/hub-list.dto';

@Controller('hubs')
export class HubsController {
    constructor(private readonly hubsService: HubsService) { }

    /**
     * GET /hubs
     * Mengambil daftar semua hub dengan pagination dan search
     */
    @Get()
    async getHubList(@Query() query: HubListQueryDto): Promise<HubListResponseDto> {
        return this.hubsService.getHubList(query);
    }
}
