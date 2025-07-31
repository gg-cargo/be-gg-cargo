import { Table, Column, Model, DataType, PrimaryKey, AllowNull, Default } from 'sequelize-typescript';

@Table({
    tableName: 'payment_order',
    timestamps: false, // Karena kita hanya menggunakan created_at manual
})
export class PaymentOrder extends Model {
    @PrimaryKey
    @Column(DataType.STRING(100))
    declare id: string;

    @AllowNull(true)
    @Column(DataType.STRING(50))
    declare order_id: string;

    @AllowNull(true)
    @Column(DataType.STRING(100))
    declare no_tracking: string;

    @AllowNull(true)
    @Column(DataType.STRING(100))
    declare kledo_id: string;

    @AllowNull(true)
    @Column(DataType.STRING(100))
    declare layanan: string;

    @AllowNull(true)
    @Default('0')
    @Column(DataType.TEXT)
    declare amount: string;

    @AllowNull(true)
    @Column(DataType.STRING(50))
    declare bank_id: string;

    @AllowNull(true)
    @Column(DataType.TEXT)
    declare bank_name: string;

    @AllowNull(true)
    @Column(DataType.TEXT)
    declare attachment: string;

    @AllowNull(true)
    @Column(DataType.STRING(100))
    declare user_name: string;

    @AllowNull(true)
    @Column(DataType.STRING(50))
    declare user_id: string;

    @AllowNull(true)
    @Column(DataType.TEXT)
    declare date: string;

    @AllowNull(false)
    @Default(DataType.NOW)
    @Column(DataType.DATE)
    declare created_at: Date;
} 