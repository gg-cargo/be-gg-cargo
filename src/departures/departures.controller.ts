import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DeparturesService } from './departures.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('master/departures')
export class DeparturesController {
  constructor(private readonly service: DeparturesService) {}

  @Get()
  async list() {
    const data = await this.service.findAll();
    return { success: true, message: 'List departures', data };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any) {
    const created = await this.service.create(body);
    return { success: true, message: 'Departure created', data: created };
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.findOne(id);
    return { success: true, message: 'Departure detail', data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const updated = await this.service.update(id, body);
    return { success: true, message: 'Departure updated', data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  async start(@Param('id', ParseIntPipe) id: number) {
    const res = await this.service.start(id);
    return { success: true, message: 'Departure started', data: res };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number) {
    const res = await this.service.complete(id);
    return { success: true, message: 'Departure completed', data: res };
  }
}

