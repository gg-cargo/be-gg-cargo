import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import { Order } from './order.model';
import { User } from './user.model';

export interface OrderDeliverDriverAttributes {
    id?: number;
    order_id: number;
    driver_id: number;
    assign_date: Date;
    name: string;
    photo: string;
    notes: string;
    signature: string;
    status: number;
    svc_id?: string;
    qty_scan?: number;
    latlng?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface OrderDeliverDriverCreationAttributes extends Omit<OrderDeliverDriverAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({
    tableName: 'order_deliver_drivers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})
export class OrderDeliverDriver extends Model<OrderDeliverDriverAttributes, OrderDeliverDriverCreationAttributes> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Index
    @ForeignKey(() => Order)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_id: number;

    @Index
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    driver_id: number;

    @Index
    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    assign_date: Date;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    photo: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    notes: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    signature: string;

    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    status: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    svc_id?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    qty_scan?: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    latlng?: string;

    @Index
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at?: Date;

    // Associations
    @BelongsTo(() => Order, 'order_id')
    order: Order;

    @BelongsTo(() => User, 'driver_id')
    driver: User;
}
