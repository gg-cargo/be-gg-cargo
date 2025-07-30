import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_pickup_drivers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class OrderPickupDriver extends Model<OrderPickupDriver> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    driver_id: number;

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

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    status: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    svc_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    latlng: string;
} 