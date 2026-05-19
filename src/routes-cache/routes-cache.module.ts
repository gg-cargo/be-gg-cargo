import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MasterRoute } from '../models/master-route.model';
import { ApiUsageLog } from '../models/api-usage-log.model';
import { GoogleRoutesService } from './google-routes.service';
import { RoutesCacheService } from './routes-cache.service';
import { RoutesCacheController } from './routes-cache.controller';

@Module({
  imports: [SequelizeModule.forFeature([MasterRoute, ApiUsageLog])],
  controllers: [RoutesCacheController],
  providers: [GoogleRoutesService, RoutesCacheService],
  exports: [GoogleRoutesService, RoutesCacheService],
})
export class RoutesCacheModule {}
