import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { FinanceModule } from './finance/finance.module';
import { PickupsModule } from './pickups/pickups.module';
import { TrackingsModule } from './trackings/trackings.module';
import { CityModule } from './city/city.module';
import { BanksModule } from './banks/banks.module';
import { DriversModule } from './drivers/drivers.module';
import { FileModule } from './file/file.module';
import { HealthModule } from './health/health.module';
import { HubsModule } from './hubs/hubs.module';
import { UsersAddressModule } from './users-address/users-address.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { databaseConfig } from './config/database';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { TransportersModule } from './transporters/transporters.module';
import { NotificationBadgesModule } from './notification-badges/notification-badges.module';
import { RatesModule } from './rates/rates.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { OcrModule } from './ocr/ocr.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    OrdersModule,
    FinanceModule,
    PickupsModule,
    TrackingsModule,
    CityModule,
    BanksModule,
    DriversModule,
    FileModule,
    HealthModule,
    HubsModule,
    UsersAddressModule,
    PaymentsModule,
    InvoicesModule,
    WhatsappModule,
    VehiclesModule,
    DeliveryNotesModule,
    TransportersModule,
    NotificationBadgesModule,
    RatesModule,
    GeocodingModule,
    OcrModule,
    VendorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
