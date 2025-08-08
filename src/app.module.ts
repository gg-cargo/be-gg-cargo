import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';
import { UsersAddressModule } from './users-address/users-address.module';
import { FileModule } from './file/file.module';
import { CityModule } from './city/city.module';
import { PickupsModule } from './pickups/pickups.module';
import { DriversModule } from './drivers/drivers.module';
import { TrackingsModule } from './trackings/trackings.module';
import { FinanceModule } from './finance/finance.module';
import { UsersModule } from './users/users.module';
import { BanksModule } from './banks/banks.module';
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
    TrackingsModule,
    FinanceModule,
    UsersModule,
    BanksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
