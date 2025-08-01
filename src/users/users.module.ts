import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../models/user.model';
import { Level } from '../models/level.model';
import { ServiceCenter } from '../models/service-center.model';
import { Hub } from '../models/hub.model';

@Module({
    imports: [
        SequelizeModule.forFeature([User, Level, ServiceCenter, Hub]),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { } 