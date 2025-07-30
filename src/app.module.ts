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
import { UsersAddressModule } from './users-address/users-address.module';
import { FileModule } from './file/file.module';
import { CityModule } from './city/city.module';
import { PickupsModule } from './pickups/pickups.module';
import { DriversModule } from './drivers/drivers.module';
import * as dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  dialect: process.env.DB_DIALECT || 'mysql',
};

console.log('[DB CONFIG]', dbConfig);

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: dbConfig.host,
      port: dbConfig.port ? parseInt(dbConfig.port) : 3306,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      autoLoadModels: true,
      synchronize: false,
      logging: false,
    }),
    AuthModule,
    OrdersModule,
    HealthModule,
    UsersAddressModule,
    FileModule,
    CityModule,
    PickupsModule,
    DriversModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
