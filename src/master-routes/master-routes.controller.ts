import { Controller, Get, Query, Post, Body, Param, Patch, Delete, UseGuards, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { MasterRoutesService } from './master-routes.service';
import { CreateMasterRouteDto } from './dto/create-master-route.dto';
import { UpdateMasterRouteDto } from './dto/update-master-route.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RouteGatesService } from '../route-gates/route-gates.service';

@Controller('master/routes')
export class MasterRoutesController {
  constructor(private readonly masterRoutesService: MasterRoutesService, private readonly routeGatesService: RouteGatesService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('road_constraint') road_constraint?: string,
  ) {
    const pageNum = parseInt(page || '1') || 1;
    const limitNum = parseInt(limit || '20') || 20;
    const result = await this.masterRoutesService.findAll({ page: pageNum, limit: limitNum, search, road_constraint });
    return { success: true, message: 'List master routes', ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateMasterRouteDto) {
    // basic validation already via DTO; service will create route_code
    try {
      const created = await this.masterRoutesService.create(dto);
      return { success: true, message: 'Master route created', data: created };
    } catch (err) {
      throw new HttpException('Failed to create master route', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('dataset')
  async dataset(@Query('bbox') bbox?: string) {
    const data = await this.routeGatesService.dataset(bbox);
    return { success: true, message: 'Route gates dataset', data };
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    const result = await this.masterRoutesService.findOne(id);
    return { success: true, message: 'Master route detail', data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMasterRouteDto) {
    const updated = await this.masterRoutesService.update(id, dto);
    return { success: true, message: 'Master route updated', data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const res = await this.masterRoutesService.remove(id);
    return { success: true, message: 'Master route deleted', data: res };
  }
}

