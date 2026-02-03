import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MasterRoutesController } from './master-routes.controller';
import { MasterRoutesService } from './master-routes.service';
import { MasterRoute } from '../models/master-route.model';
import { RouteGate } from '../models/route-gate.model';
import { RoutePolyline } from '../models/route-polyline.model';
import { MasterRouteGate } from '../models/master-route-gate.model';
import { RouteGatesModule } from '../route-gates/route-gates.module';

@Module({
  imports: [SequelizeModule.forFeature([MasterRoute, RouteGate, RoutePolyline, MasterRouteGate]), RouteGatesModule],
  controllers: [MasterRoutesController],
  providers: [MasterRoutesService],
  exports: [MasterRoutesService],
})
export class MasterRoutesModule {}

