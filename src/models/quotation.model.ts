import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'quotation',
    timestamps: false,
})
export class Quotation extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    no_quotation: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    request_by: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    preuser_by: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    customer_by: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    body: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Kg | 1: Pcs | 2: Kubikasi',
    })
    hitung_by: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    layanan: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    valid_day: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Pending | 1: Success',
    })
    status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: No | 1: Yes',
    })
    is_rejected: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    reason_rejected: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    as_kontrak_id: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    pic_name: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    address: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    user_name: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    terms: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
} 