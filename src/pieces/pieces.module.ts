import { Module } from '@nestjs/common';
import { PiecesController } from './pieces.controller';
import { DeliveryNotesModule } from '../delivery-notes/delivery-notes.module';

@Module({
    imports: [DeliveryNotesModule],
    controllers: [PiecesController],
})
export class PiecesModule { }

