import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { Order } from '../models/order.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderHistory } from '../models/order-history.model';
import { Vendor } from '../models/vendor.model';

@Module({
  imports: [SequelizeModule.forFeature([Order, OrderPickupDriver, OrderHistory, Vendor])],
  controllers: [FleetController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}

