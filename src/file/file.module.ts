import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileLog } from '../models/file-log.model';

@Module({
    imports: [SequelizeModule.forFeature([FileLog])],
    controllers: [FileController],
    providers: [FileService],
})
export class FileModule { } 