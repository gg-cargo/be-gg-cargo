import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Service } from './service.model';

export enum PricingType {
    WEIGHT = 'WEIGHT',
    ROUTE = 'ROUTE',
    DISTANCE = 'DISTANCE',
    DAILY = 'DAILY'
}

@Table({
    tableName: 'sub_services',
    timestamps: true,
    underscored: true,
})
export class SubService extends Model<SubService> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare sub_service_id: string;

    @ForeignKey(() => Service)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    service_id: string;

    @BelongsTo(() => Service)
    service: Service;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    sub_service_name: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    sla_hours: number;

    @Column({
        type: DataType.ENUM(...Object.values(PricingType)),
        allowNull: false
    })
    pricing_type: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.00
    })
    default_multiplier: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    is_active: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    sort_order: number;
}
