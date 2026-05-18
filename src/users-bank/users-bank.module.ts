import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersBank } from '../models/users-bank.model';
import { User } from '../models/user.model';
import { UsersBankController } from './users-bank.controller';
import { UsersBankService } from './users-bank.service';

@Module({
  imports: [SequelizeModule.forFeature([UsersBank, User])],
  controllers: [UsersBankController],
  providers: [UsersBankService],
  exports: [UsersBankService],
})
export class UsersBankModule {}
