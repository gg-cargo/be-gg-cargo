import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Order } from '../models/order.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { User } from '../models/user.model';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        SequelizeModule.forFeature([Order, OrderInvoice, User]),
        ConfigModule
    ],
    controllers: [InvoicesController],
    providers: [InvoicesService],
    exports: [InvoicesService]
})
export class InvoicesModule { }

