import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { Order } from '../models/order.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderHistory } from '../models/order-history.model';
import { Vendor } from '../models/vendor.model';
import { Hub } from '../models/hub.model';
import { FleetEstimate } from '../models/fleet-estimate.model';
import { FleetTrip } from '../models/fleet-trip.model';
import { FleetTripWaypoint } from '../models/fleet-trip-waypoint.model';
import { FleetTripSegment } from '../models/fleet-trip-segment.model';
import { FleetTripAssignment } from '../models/fleet-trip-assignment.model';
import { FleetTripLoadingPhoto } from '../models/fleet-trip-loading-photo.model';
import { User } from '../models/user.model';
import { FileLog } from '../models/file-log.model';
import { UsersBank } from '../models/users-bank.model';
import { FleetTripService } from './fleet-trip.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Order,
      OrderPickupDriver,
      OrderHistory,
      Vendor,
      Hub,
      FleetEstimate,
      FleetTrip,
      FleetTripWaypoint,
      FleetTripSegment,
      FleetTripAssignment,
      FleetTripLoadingPhoto,
      User,
      FileLog,
      UsersBank,
    ]),
  ],
  controllers: [FleetController],
  providers: [FleetService, FleetTripService],
  exports: [FleetService, FleetTripService],
})
export class FleetModule {}

