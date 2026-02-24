import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
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
        @Query('status') status?: string,
        @Query('hub_id') hub_id?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const pageNum = Number(page) > 0 ? Number(page) : 1;
        const pageLimit = Number(limit) > 0 ? Number(limit) : 10;
        const result = await this.transportersService.listTransportersOrCouriers(role, status, hub_id, pageNum, pageLimit);
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

    @Get('detail/:id')
    async getTransporterDetail(@Param('id', ParseIntPipe) id: number) {
        try {
            const data = await this.transportersService.getTransporterDetail(id);
            return {
                message: 'Berhasil mengambil detail transporter',
                data,
            };
        } catch (e) {
            throw new HttpException(e.message || 'Transporter tidak ditemukan', HttpStatus.NOT_FOUND);
        }
    }

    @Patch(':id/approve')
    async approveTransporter(@Param('id', ParseIntPipe) id: number) {
        try {
            const data = await this.transportersService.approveTransporter(id);
            return {
                message: 'Transporter berhasil di-approve',
                data,
            };
        } catch (e) {
            throw new HttpException(e.message || 'Gagal approve transporter', HttpStatus.BAD_REQUEST);
        }
    }

    @Patch('update/:id')
    async updateTransporter(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        try {
            const data = await this.transportersService.updateTransporter(id, body);
            return {
                message: 'Berhasil mengupdate data transporter',
                data,
            };
        } catch (e) {
            throw new HttpException(e.message || 'Gagal update transporter', HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':id')
    async deleteTransporter(@Param('id', ParseIntPipe) id: number) {
        try {
            const data = await this.transportersService.deleteTransporter(id);
            return {
                status: 'success',
                message: data.message,
                data: {
                    id: data.id,
                    name: data.name,
                },
            };
        } catch (e) {
            if (e instanceof BadRequestException) {
                throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
            }
            throw new HttpException(e.message || 'Gagal menghapus transporter/kurir', HttpStatus.BAD_REQUEST);
        }
    }
}


