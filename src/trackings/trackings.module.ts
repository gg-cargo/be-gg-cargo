import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackingsController } from './trackings.controller';
import { TrackingsService } from './trackings.service';
import { Order } from '../models/order.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { Hub } from '../models/hub.model';
import { ServiceCenter } from '../models/service-center.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Order,
            OrderPiece,
            OrderHistory,
            Hub,
            ServiceCenter,
        ]),
    ],
    controllers: [TrackingsController],
    providers: [TrackingsService],
    exports: [TrackingsService],
})
export class TrackingsModule { } 