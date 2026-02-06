import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { SubServicesController } from './sub-services.controller';
import { SubServicesService } from './sub-services.service';
import { Service } from '../models/service.model';
import { SubService } from '../models/sub-service.model';

@Module({
    imports: [SequelizeModule.forFeature([Service, SubService])],
    controllers: [ServicesController, SubServicesController],
    providers: [ServicesService, SubServicesService],
    exports: [ServicesService, SubServicesService]
})
export class MasterServicesModule { }
