import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MasterRoutesController } from './master-routes.controller';
import { MasterRoutesService } from './master-routes.service';
import { MasterRoute } from '../models/master-route.model';
import { RouteGate } from '../models/route-gate.model';
import { RoutePolyline } from '../models/route-polyline.model';

@Module({
  imports: [SequelizeModule.forFeature([MasterRoute, RouteGate, RoutePolyline])],
  controllers: [MasterRoutesController],
  providers: [MasterRoutesService],
  exports: [MasterRoutesService],
})
export class MasterRoutesModule {}

