import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RouteGatesController } from './route-gates.controller';
import { RouteGatesService } from './route-gates.service';
import { RouteGate } from '../models/route-gate.model';
import { MasterRoute } from '../models/master-route.model';

@Module({
  imports: [SequelizeModule.forFeature([RouteGate, MasterRoute])],
  controllers: [RouteGatesController],
  providers: [RouteGatesService],
  exports: [RouteGatesService],
})
export class RouteGatesModule {}

