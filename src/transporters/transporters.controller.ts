import { Body, Controller, HttpException, HttpStatus, Post, Query, Get } from '@nestjs/common';
import { TransportersService } from './transporters.service';

@Controller('transporters')
export class TransportersController {
    constructor(private readonly transportersService: TransportersService) { }

    @Post('register')
    async registerTransporter(@Body() body: any) {
        try {
            const data = await this.transportersService.registerTransporter(body);
            return {
                status: 'success',
                message: `Registrasi transporter/kuri ${data.name} berhasil. Menunggu verifikasi.`,
                data,
            };
        } catch (error) {
            throw new HttpException(error.message || 'Registrasi gagal', HttpStatus.BAD_REQUEST);
        }
    }

    @Get('list')
    async listTransportersOrCouriers(
        @Query('role') role?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const pageNum = Number(page) > 0 ? Number(page) : 1;
        const pageLimit = Number(limit) > 0 ? Number(limit) : 10;
        const result = await this.transportersService.listTransportersOrCouriers(role, pageNum, pageLimit);
        return {
            message: 'Berhasil mengambil data list transporter/kurir',
            data: result.data,
            pagination: {
                total: result.total,
                page: pageNum,
                limit: pageLimit
            }
        };
    }

    @Get('available')
    async getAvailableTransporters(@Query() query: any) {
        const data = await this.transportersService.getAvailableTransporters(query);
        return {
            message: 'Berhasil mengambil daftar transporter tersedia',
            data,
        };
    }
}


