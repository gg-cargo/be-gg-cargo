import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterTarif } from './master-tarif.model';

@Table({
    tableName: 'tariff_weight_tier',
    timestamps: true,
    underscored: true,
})
export class TariffWeightTier extends Model<TariffWeightTier> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare tier_id: string;

    @ForeignKey(() => MasterTarif)
    @Column({ type: DataType.STRING(50), allowNull: false })
    tariff_id: string;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
    min_weight_kg: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
    max_weight_kg: number;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    rate_per_kg: number;

    @BelongsTo(() => MasterTarif)
    tariff: MasterTarif;
}
