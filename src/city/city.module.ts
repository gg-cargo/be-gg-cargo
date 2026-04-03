import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { City } from '../models/city.model';
import { Hub } from '../models/hub.model';

@Module({
    imports: [SequelizeModule.forFeature([City, Hub])],
    controllers: [CityController],
    providers: [CityService],
})
export class CityModule { }