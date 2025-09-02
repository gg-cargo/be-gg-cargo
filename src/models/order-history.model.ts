import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.model';
import { User } from './user.model';

@Table({
    tableName: 'order_histories',
    timestamps: false,
})
export class OrderHistory extends Model {
    @Column({
        type: DataType.INTEGER,
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
        type: DataType.STRING(50),
        allowNull: false,
    })
    status: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    provinsi: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kota: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: true,
    })
    date: Date;

    @Column({
        type: DataType.TIME,
        allowNull: true,
    })
    time: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    remark: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    parent_type: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    parent_id: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    parent_docs: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    created_by: number;

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
    updated_at: Date;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    base64Foto: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    base64SignDriver: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    base64SignCustomer: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    latlng: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    totPieceScan: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    totPieceAll: number;

    @BelongsTo(() => Order, { foreignKey: 'order_id', as: 'order' })
    order: Order;

    @BelongsTo(() => User, { foreignKey: 'created_by', as: 'createdByUser' })
    createdByUser: User;
} 