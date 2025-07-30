import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { User } from '../models/user.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { LogGps } from '../models/log-gps.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            User,
            OrderPickupDriver,
            LogGps,
        ]),
    ],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService],
})
export class DriversModule { } 