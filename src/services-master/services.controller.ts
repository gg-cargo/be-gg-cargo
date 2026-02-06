import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('master/services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('is_active') is_active?: string
    ) {
        const pageNum = parseInt(page || '1') || 1;
        const limitNum = parseInt(limit || '20') || 20;

        const result = await this.servicesService.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            is_active
        });

        return { success: true, message: 'List services', ...result };
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.servicesService.findOne(id);
        return { success: true, message: 'Detail service', data: result };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createServiceDto: CreateServiceDto) {
        const created = await this.servicesService.create(createServiceDto);
        return { success: true, message: 'Service created successfully', data: created };
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateServiceDto: UpdateServiceDto) {
        const updated = await this.servicesService.update(id, updateServiceDto);
        return { success: true, message: 'Service updated successfully', data: updated };
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.servicesService.remove(id);
        return { success: true, message: 'Service deleted successfully' };
    }
}
