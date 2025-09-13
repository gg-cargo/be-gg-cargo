import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificationBadgesController } from './notification-badges.controller';
import { NotificationBadgesService } from './notification-badges.service';
import { NotificationBadge } from '../models/notification-badge.model';

@Module({
    imports: [SequelizeModule.forFeature([NotificationBadge])],
    controllers: [NotificationBadgesController],
    providers: [NotificationBadgesService],
    exports: [NotificationBadgesService],
})
export class NotificationBadgesModule { }
