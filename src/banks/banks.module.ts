import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { Bank } from '../models/bank.model';

@Module({
    imports: [
        SequelizeModule.forFeature([Bank]),
    ],
    controllers: [BanksController],
    providers: [BanksService],
    exports: [BanksService],
})
export class BanksModule { } 