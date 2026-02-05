import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TariffsController } from './tariffs.controller';
import { TariffsService } from './tariffs.service';
import { MasterTarif } from '../models/master-tarif.model';
import { TariffWeightTier } from '../models/tarif-weight-tier.model';
import { TariffRoutePrice } from '../models/tarif-route-price.model';
import { TariffDistance } from '../models/tarif-distance.model';
import { TariffVehicleDaily } from '../models/tarif-vehicle-daily.model';
import { TariffSeaFreight } from '../models/tarif-sea-freight.model';
import { TariffSurcharge } from '../models/tarif-surcharge.model';
import { TariffServiceMultiplier } from '../models/tarif-service-multiplier.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            MasterTarif,
            TariffWeightTier,
            TariffRoutePrice,
            TariffDistance,
            TariffVehicleDaily,
            TariffSeaFreight,
            TariffSurcharge,
            TariffServiceMultiplier,
        ]),
    ],
    controllers: [TariffsController],
    providers: [TariffsService],
    exports: [TariffsService],
})
export class TariffsModule { }
