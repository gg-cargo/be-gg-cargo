import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../models/user.model';
import { Level } from '../models/level.model';
import { ServiceCenter } from '../models/service-center.model';
import { Hub } from '../models/hub.model';
import { Saldo } from '../models/saldo.model';
import { TransactionPayment } from '../models/transaction-payment.model';
import { DumpOtp } from '../models/dump-otp.model';
import { PasswordReset } from '../models/password-reset.model';
import { UsersAddress } from '../models/users-address.model';
import { CustomerCompanyMember } from '../models/customer-company-member.model';
import { UsersEmergencyContact } from '../models/users_emergency_contact.model';
import { NotificationBadge } from '../models/notification-badge.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            User,
            Level,
            ServiceCenter,
            Hub,
            Saldo,
            TransactionPayment,
            DumpOtp,
            PasswordReset,
            UsersAddress,
            CustomerCompanyMember,
            UsersEmergencyContact,
            NotificationBadge,
        ]),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { } 