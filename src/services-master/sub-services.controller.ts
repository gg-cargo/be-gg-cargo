import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SubServicesService } from './sub-services.service';
import { CreateSubServiceDto } from './dto/create-sub-service.dto';
import { UpdateSubServiceDto } from './dto/update-sub-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('master/sub-services')
export class SubServicesController {
    constructor(private readonly subServicesService: SubServicesService) { }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('service_id') service_id?: string
    ) {
        const pageNum = parseInt(page || '1') || 1;
        const limitNum = parseInt(limit || '20') || 20;

        const result = await this.subServicesService.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            service_id: service_id
        });

        return { success: true, message: 'List sub services', ...result };
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.subServicesService.findOne(id);
        return { success: true, message: 'Detail sub service', data: result };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createSubServiceDto: CreateSubServiceDto) {
        const created = await this.subServicesService.create(createSubServiceDto);
        return { success: true, message: 'Sub Service created successfully', data: created };
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSubServiceDto: UpdateSubServiceDto) {
        const updated = await this.subServicesService.update(id, updateSubServiceDto);
        return { success: true, message: 'Sub Service updated successfully', data: updated };
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.subServicesService.remove(id);
        return { success: true, message: 'Sub Service deleted successfully' };
    }
}
