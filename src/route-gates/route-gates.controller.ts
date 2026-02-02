import { Controller, Get, Query, Param, Post, Body, Patch, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RouteGatesService } from './route-gates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('master/routes')
export class RouteGatesController {
  constructor(private readonly service: RouteGatesService) {}


  @UseGuards(JwtAuthGuard)
  @Post(':id/gates')
  async addGate(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const created = await this.service.addGateToRoute(id, body);
    return { success: true, message: 'Gate added to route', data: created };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/gates/:gateId')
  async updateGate(@Param('id', ParseIntPipe) id: number, @Param('gateId', ParseIntPipe) gateId: number, @Body() body: any) {
    const updated = await this.service.updateGate(id, gateId, body);
    return { success: true, message: 'Gate updated', data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/gates/:gateId')
  async removeGate(@Param('id', ParseIntPipe) id: number, @Param('gateId', ParseIntPipe) gateId: number) {
    const res = await this.service.removeGateFromRoute(id, gateId);
    return { success: true, message: 'Gate removed from route', data: res };
  }
}

