import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterTarif } from './master-tarif.model';

@Table({
    tableName: 'tariff_sea_freight',
    timestamps: true,
    underscored: true,
})
export class TariffSeaFreight extends Model<TariffSeaFreight> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare sea_id: string;

    @ForeignKey(() => MasterTarif)
    @Column({ type: DataType.STRING(50), allowNull: false })
    tariff_id: string;

    @Column({ type: DataType.STRING(200), allowNull: false })
    origin_port: string;

    @Column({ type: DataType.STRING(200), allowNull: false })
    destination_port: string;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    rate_per_cbm: number;

    @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'USD' })
    currency: string;

    @BelongsTo(() => MasterTarif)
    tariff: MasterTarif;
}
