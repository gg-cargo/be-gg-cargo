import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeparturesController } from './departures.controller';
import { DeparturesService } from './departures.service';
import { Departure } from '../models/departure.model';
import { TruckList } from '../models/truck-list.model';
import { User } from '../models/user.model';
import { MasterRoute } from '../models/master-route.model';
import { LogGps } from '../models/log-gps.model';
import { Hub } from '../models/hub.model';
import { RouteGate } from '../models/route-gate.model';
import { RoutePolyline } from '../models/route-polyline.model';
import { MasterRouteGate } from '../models/master-route-gate.model';

@Module({
  imports: [SequelizeModule.forFeature([Departure, TruckList, User, MasterRoute, LogGps, Hub, RouteGate, RoutePolyline, MasterRouteGate])],
  controllers: [DeparturesController],
  providers: [DeparturesService],
  exports: [DeparturesService],
})
export class DeparturesModule { }

