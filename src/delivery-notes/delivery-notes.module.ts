import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeliveryNotesController } from './delivery-notes.controller';
import { DeliveryNotesService } from './delivery-notes.service';
import { Order } from '../models/order.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderDeliveryNote } from '../models/order-delivery-note.model';
import { Hub } from '../models/hub.model';
import { TruckList } from '../models/truck-list.model';
import { JobAssign } from '../models/job-assign.model';
import { User } from '../models/user.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderManifestInbound } from '../models/order-manifest-inbound.model';

@Module({
    imports: [SequelizeModule.forFeature([Order, OrderPiece, OrderDeliveryNote, Hub, TruckList, JobAssign, User, OrderHistory, OrderManifestInbound])],
    controllers: [DeliveryNotesController],
    providers: [DeliveryNotesService],
    exports: [DeliveryNotesService],
})
export class DeliveryNotesModule { }
