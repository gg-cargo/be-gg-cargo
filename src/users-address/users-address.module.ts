import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersAddress } from '../models/users-address.model';
import { UsersAddressController } from './users-address.controller';
import { UsersAddressService } from './users-address.service';

@Module({
    imports: [SequelizeModule.forFeature([UsersAddress])],
    controllers: [UsersAddressController],
    providers: [UsersAddressService],
    exports: [UsersAddressService],
})
export class UsersAddressModule { } 