import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderList } from '../models/order-list.model';
import { OrderReferensi } from '../models/order-referensi.model';
import { RequestCancel } from '../models/request-cancel.model';
import { User } from '../models/user.model';
import { TransactionPayment } from '../models/transaction-payment.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Order,
            OrderShipment,
            OrderPiece,
            OrderHistory,
            OrderList,
            OrderReferensi,
            RequestCancel,
            User,
            TransactionPayment
        ])
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService]
})
export class OrdersModule { } 