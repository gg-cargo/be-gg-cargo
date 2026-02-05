import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { TariffWeightTier } from './tarif-weight-tier.model';
import { TariffRoutePrice } from './tarif-route-price.model';
import { TariffDistance } from './tarif-distance.model';
import { TariffVehicleDaily } from './tarif-vehicle-daily.model';
import { TariffSeaFreight } from './tarif-sea-freight.model';
import { TariffSurcharge } from './tarif-surcharge.model';

@Table({
    tableName: 'master_tarif',
    timestamps: true,
    underscored: true,
})
export class MasterTarif extends Model<MasterTarif> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare tariff_id: string;

    @Column({
        type: DataType.ENUM('KIRIM_BARANG', 'KIRIM_MOTOR', 'SEWA_TRUK', 'INTERNATIONAL'),
        allowNull: false
    })
    service_type: string;

    @Column({
        type: DataType.ENUM('HEMAT', 'REGULER', 'PAKET', 'EXPRESS'),
        allowNull: false
    })
    sub_service: string;

    @Column({ type: DataType.STRING(200), allowNull: false })
    tariff_name: string;

    @Column({
        type: DataType.ENUM('WEIGHT_BASED', 'ROUTE_BASED', 'DISTANCE_BASED', 'DAILY_BASED'),
        allowNull: false
    })
    pricing_model: string;

    @Column({ type: DataType.STRING(50), allowNull: true })
    customer_id: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    origin_zone: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    destination_zone: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    vehicle_type: string;

    @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'IDR' })
    currency: string;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
    min_charge: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    sla_hours: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    is_active: boolean;

    @Column({ type: DataType.DATEONLY, allowNull: false })
    effective_start: Date;

    @Column({ type: DataType.DATEONLY, allowNull: true })
    effective_end: Date;

    @HasMany(() => TariffWeightTier)
    weightTiers: TariffWeightTier[];

    @HasMany(() => TariffRoutePrice)
    routePrices: TariffRoutePrice[];

    @HasMany(() => TariffDistance)
    distanceConfigs: TariffDistance[];

    @HasMany(() => TariffVehicleDaily)
    dailyRates: TariffVehicleDaily[];

    @HasMany(() => TariffSeaFreight)
    seaFreights: TariffSeaFreight[];

    @HasMany(() => TariffSurcharge)
    surcharges: TariffSurcharge[];
}
