import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { User } from './models/user.model';
import { DumpOtp } from './models/dump-otp.model';
import { PasswordReset } from './models/password-reset.model';
import { Level } from './models/level.model';
import { Order } from './models/order.model';
import { OrderShipment } from './models/order-shipment.model';
import { OrderPiece } from './models/order-piece.model';
import { OrderHistory } from './models/order-history.model';
import { OrderReferensi } from './models/order-referensi.model';
import { OrderInvoice } from './models/order-invoice.model';
import { OrderInvoiceDetail } from './models/order-invoice-detail.model';
import { OrderDeliveryNote } from './models/order-delivery-note.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_DEVELOPMENT_HOST || 'localhost',
      port: parseInt(process.env.DB_DEVELOPMENT_PORT || '3306'),
      username: process.env.DB_DEVELOPMENT_USERNAME || 'root',
      password: process.env.DB_DEVELOPMENT_PASSWORD || '',
      database: process.env.DB_DEVELOPMENT_DATABASE || 'api',
      models: [
        User,
        DumpOtp,
        PasswordReset,
        Level,
        Order,
        OrderShipment,
        OrderPiece,
        OrderHistory,
        OrderReferensi,
        OrderInvoice,
        OrderInvoiceDetail,
        OrderDeliveryNote,
      ],
      autoLoadModels: true,
      synchronize: false, // Set false karena kita pakai migration
    }),
    AuthModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
