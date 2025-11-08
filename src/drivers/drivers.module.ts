import { Module } from '@nestjs/common';
import { NotificationBadgesModule } from '../notification-badges/notification-badges.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { User } from '../models/user.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';
import { Order } from '../models/order.model';
import { Hub } from '../models/hub.model';
import { LogGps } from '../models/log-gps.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderPiece } from '../models/order-piece.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            User,
            OrderPickupDriver,
            OrderDeliverDriver,
            Order,
            LogGps,
            Hub,
            OrderHistory,
            OrderPiece,
        ]),
        NotificationBadgesModule,
    ],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService],
})
export class DriversModule { } 