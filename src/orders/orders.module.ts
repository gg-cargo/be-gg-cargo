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
import { OrderInvoice } from '../models/order-invoice.model';
import { OrderInvoiceDetail } from '../models/order-invoice-detail.model';
import { Bank } from '../models/bank.model';
import { Level } from '../models/level.model';
import { FileLog } from '../models/file-log.model';
import { ReweightCorrectionRequest } from '../models/reweight-correction-request.model';
import { OrderDeliveryNote } from '../models/order-delivery-note.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';
import { LogGps } from '../models/log-gps.model';
import { Hub } from '../models/hub.model';
import { OrderKendala } from '../models/order-kendala.model';
import { FileService } from '../file/file.service';
import { DriversService } from '../drivers/drivers.service';
import { DriversModule } from '../drivers/drivers.module';

@Module({
    imports: [
        DriversModule,
        SequelizeModule.forFeature([
            Order,
            OrderShipment,
            OrderPiece,
            OrderHistory,
            OrderList,
            OrderReferensi,
            RequestCancel,
            User,
            TransactionPayment,
            OrderInvoice,
            OrderInvoiceDetail,
            Bank,
            Level,
            FileLog,
            ReweightCorrectionRequest,
            OrderDeliveryNote,
            OrderPickupDriver,
            OrderDeliverDriver,
            LogGps,
            Hub,
            OrderKendala
        ])
    ],
    controllers: [OrdersController],
    providers: [OrdersService, FileService, DriversService],
    exports: [OrdersService]
})
export class OrdersModule { } 