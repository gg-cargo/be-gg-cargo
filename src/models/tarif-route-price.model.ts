import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterTarif } from './master-tarif.model';

@Table({
    tableName: 'tariff_route_price',
    timestamps: true,
    underscored: true,
})
export class TariffRoutePrice extends Model<TariffRoutePrice> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare route_price_id: string;

    @ForeignKey(() => MasterTarif)
    @Column({ type: DataType.STRING(50), allowNull: false })
    tariff_id: string;

    @Column({ type: DataType.STRING(200), allowNull: false })
    origin_city: string;

    @Column({ type: DataType.STRING(200), allowNull: false })
    destination_city: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    item_type: string;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    price: number;

    @BelongsTo(() => MasterTarif)
    tariff: MasterTarif;
}
