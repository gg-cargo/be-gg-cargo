import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TransportersController } from './transporters.controller';
import { TransportersService } from './transporters.service';
import { User } from '../models/user.model';
import { TruckList } from '../models/truck-list.model';
import { JobAssign } from '../models/job-assign.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';

@Module({
    imports: [SequelizeModule.forFeature([User, TruckList, JobAssign, OrderPickupDriver, OrderDeliverDriver])],
    controllers: [TransportersController],
    providers: [TransportersService],
})
export class TransportersModule { }


