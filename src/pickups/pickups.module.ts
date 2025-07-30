import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PickupsController } from './pickups.controller';
import { PickupsService } from './pickups.service';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderNotifikasi } from '../models/order-notifikasi.model';
import { OrderPiece } from '../models/order-piece.model';
import { RequestCancel } from '../models/request-cancel.model';
import { User } from '../models/user.model';

@Module({
    imports: [SequelizeModule.forFeature([
        Order,
        OrderShipment,
        OrderPickupDriver,
        OrderHistory,
        OrderNotifikasi,
        OrderPiece,
        RequestCancel,
        User
    ])],
    controllers: [PickupsController],
    providers: [PickupsService],
})
export class PickupsModule { } 