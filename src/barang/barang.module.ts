import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BarangController } from './barang.controller';
import { BarangService } from './barang.service';
import { Barang } from '../models/barang.model';

@Module({
    imports: [
        SequelizeModule.forFeature([Barang]),
    ],
    controllers: [BarangController],
    providers: [BarangService],
    exports: [BarangService],
})
export class BarangModule { }
