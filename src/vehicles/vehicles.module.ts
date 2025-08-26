import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { TruckList } from '../models/truck-list.model';

@Module({
    imports: [SequelizeModule.forFeature([TruckList])],
    controllers: [VehiclesController],
    providers: [VehiclesService],
    exports: [VehiclesService],
})
export class VehiclesModule { }
