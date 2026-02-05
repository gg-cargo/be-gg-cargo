import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'tariff_service_multiplier',
    timestamps: true,
    underscored: true,
})
export class TariffServiceMultiplier extends Model<TariffServiceMultiplier> {
    @Column({ type: DataType.STRING(50), primaryKey: true })
    declare multiplier_id: string;

    @Column({
        type: DataType.ENUM('HEMAT', 'REGULER', 'PAKET', 'EXPRESS'),
        allowNull: false,
        unique: true
    })
    sub_service: string;

    @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
    multiplier: number;
}
