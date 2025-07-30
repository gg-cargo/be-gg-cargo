import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'request_cancel',
    timestamps: false,
})
export class RequestCancel extends Model<RequestCancel> {
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
    user_id: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        defaultValue: 'Tidak jadi memesan',
    })
    reason: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: 0,
    })
    status: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
} 