import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_referensi',
    timestamps: false,
})
export class OrderReferensi extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    order_id: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    nomor: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    url: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    raw: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    source: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
    })
    status_delete: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
} 