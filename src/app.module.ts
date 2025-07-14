import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';
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
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'api',
      password: process.env.DB_PASSWORD || 'Gaspol@1234',
      database: process.env.DB_DATABASE || 'api',
      autoLoadModels: true,
      synchronize: false,
      logging: false,
    }),
    AuthModule,
    OrdersModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
