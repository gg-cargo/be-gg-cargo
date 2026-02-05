import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterTarif } from './master-tarif.model';

@Table({
    tableName: 'tariff_surcharge',
    timestamps: true,
    underscored: true,
})
export class TariffSurcharge extends Model<TariffSurcharge> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare surcharge_id: string;

    @ForeignKey(() => MasterTarif)
    @Column({ type: DataType.STRING(50), allowNull: false })
    tariff_id: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    surcharge_type: string;

    @Column({ type: DataType.ENUM('PERCENT', 'FIXED'), allowNull: false })
    calculation: string;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    value: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    condition: string;

    @BelongsTo(() => MasterTarif)
    tariff: MasterTarif;
}
