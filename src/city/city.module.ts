import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { City } from '../models/city.model';

@Module({
    imports: [SequelizeModule.forFeature([City])],
    controllers: [CityController],
    providers: [CityService],
})
export class CityModule { } 