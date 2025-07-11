import { Column, DataType, Model, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Order } from './order.model';

@Table({
    tableName: 'order_shipments',
    timestamps: false,
})
export class OrderShipment extends Model {
    @Column({
        type: DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ForeignKey(() => Order)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    order_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    qty: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    berat: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    panjang: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    lebar: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    tinggi: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    })
    qty_reweight: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    })
    berat_reweight: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    })
    panjang_reweight: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    })
    lebar_reweight: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    })
    tinggi_reweight: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at: Date;

    // Relations
    @BelongsTo(() => Order, { foreignKey: 'order_id', as: 'order' })
    order: Order;
} 