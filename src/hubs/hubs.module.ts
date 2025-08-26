import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';
import { Hub } from '../models/hub.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Hub,
        ]),
    ],
    controllers: [HubsController],
    providers: [HubsService],
    exports: [HubsService],
})
export class HubsModule { }
