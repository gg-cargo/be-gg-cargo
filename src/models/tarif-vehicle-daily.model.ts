import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterTarif } from './master-tarif.model';

@Table({
    tableName: 'tariff_vehicle_daily',
    timestamps: true,
    underscored: true,
})
export class TariffVehicleDaily extends Model<TariffVehicleDaily> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare daily_id: string;

    @ForeignKey(() => MasterTarif)
    @Column({ type: DataType.STRING(50), allowNull: false })
    tariff_id: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    vehicle_type: string;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    daily_rate: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    max_hours: number;

    @BelongsTo(() => MasterTarif)
    tariff: MasterTarif;
}
