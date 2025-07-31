import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default } from 'sequelize-typescript';

@Table({
    tableName: 'invoices',
    timestamps: true, // Menggunakan created_at dan updated_at otomatis
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Invoice extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @AllowNull(true)
    @Column(DataType.STRING(255))
    declare no_tracking: string;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    declare order_id: number;

    @AllowNull(true)
    @Column(DataType.STRING(50))
    declare invoice_no: string;

    @AllowNull(true)
    @Column(DataType.STRING(255))
    declare payment_status: string;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    declare kode_unik: number;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    declare konfirmasi_bayar: number;

    @AllowNull(true)
    @Column(DataType.DOUBLE)
    declare total: number;

    @AllowNull(true)
    @Column(DataType.DOUBLE)
    declare amount: number;

    @AllowNull(false)
    @Default(DataType.NOW)
    @Column(DataType.DATE)
    declare created_at: Date;

    @AllowNull(false)
    @Default(DataType.NOW)
    @Column(DataType.DATE)
    declare updated_at: Date;
} 