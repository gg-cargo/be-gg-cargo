import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Order } from '../models/order.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { TransactionPayment } from '../models/transaction-payment.model';
import { OrderHistory } from '../models/order-history.model';
import { User } from '../models/user.model';
import { PaymentOrder } from '../models/payment-order.model';
import { Saldo } from '../models/saldo.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Order,
            OrderInvoice,
            TransactionPayment,
            OrderHistory,
            User,
            PaymentOrder,
            Saldo
        ]),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }
