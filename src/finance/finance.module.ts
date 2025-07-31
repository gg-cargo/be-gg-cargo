import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Order } from '../models/order.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { Invoice } from '../models/invoice.model';
import { PaymentOrder } from '../models/payment-order.model';
import { User } from '../models/user.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Order,
            OrderInvoice,
            Invoice,
            PaymentOrder,
            User,
            OrderShipment,
            OrderPiece,
        ]),
    ],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService],
})
export class FinanceModule { } 