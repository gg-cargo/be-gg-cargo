import { Controller, Get, Query } from '@nestjs/common';
import { BanksService } from './banks.service';
import { GetInternalBanksDto } from './dto/get-internal-banks.dto';
import { InternalBanksResponseDto } from './dto/internal-banks-response.dto';

@Controller('banks')
export class BanksController {
    constructor(private readonly banksService: BanksService) { }

    @Get('internal')
    async getInternalBanks(@Query() query: GetInternalBanksDto): Promise<InternalBanksResponseDto> {
        const banks = await this.banksService.getInternalBanks(query);

        return {
            message: 'Daftar rekening bank internal berhasil diambil',
            data: banks,
        };
    }
} 