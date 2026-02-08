import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterTarif } from './master-tarif.model';

@Table({
    tableName: 'tariff_distance',
    timestamps: true,
    underscored: true,
})
export class TariffDistance extends Model<TariffDistance> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare distance_id: string;

    @ForeignKey(() => MasterTarif)
    @Column({ type: DataType.STRING(50), allowNull: false })
    tariff_id: string;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    base_price: number;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    rate_per_km: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
    min_km: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
    max_km: number;

    @Column({ type: DataType.STRING(100), allowNull: true })
    item_type: string;

    @BelongsTo(() => MasterTarif)
    tariff: MasterTarif;
}
