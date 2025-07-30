import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_notifikasi',
    timestamps: false,
})
export class OrderNotifikasi extends Model<OrderNotifikasi> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(250),
        allowNull: true,
        defaultValue: null,
    })
    message: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: null,
    })
    svc_source: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: null,
    })
    hub_source: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: null,
    })
    svc_dest: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: null,
    })
    hub_dest: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: 1,
    })
    status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    reweight: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    pembayaran: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    voucher: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    saldo: number;

    @Column({
        type: DataType.STRING(25),
        allowNull: false,
        defaultValue: '0',
    })
    pengiriman: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    news: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    user_id: number;
} 