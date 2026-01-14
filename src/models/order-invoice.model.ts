import { Column, DataType, Model, Table, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Order } from './order.model';
import { OrderInvoiceDetail } from './order-invoice-detail.model';

@Table({
    tableName: 'order_invoices',
    timestamps: false,
})
export class OrderInvoice extends Model {
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
        allowNull: true,
    })
    invoice_no: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
    })
    invoice_date: Date;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    payment_terms: string;

    @Column({
        type: DataType.STRING(3),
        allowNull: true,
        defaultValue: 'IDR',
        comment: 'Mata uang yang ditagihkan (contoh: IDR, SGD)',
    })
    billed_currency: string;

    @Column({
        type: DataType.DECIMAL(18, 2),
        allowNull: true,
        comment: 'Nominal yang ditagihkan sesuai billed_currency (untuk international input manual)',
    })
    billed_amount: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    vat: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    discount: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    packing: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    asuransi: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    ppn: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    pph: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    kode_unik: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    konfirmasi_bayar: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    beneficiary_name: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    acc_no: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    bank_name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    bank_address: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    swift_code: string;

    @Column({
        type: DataType.STRING(250),
        allowNull: true,
    })
    paid_attachment: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    payment_info: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    fm: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    lm: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    bill_to_name: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    bill_to_phone: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    bill_to_address: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    create_date: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    updated_at: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Ya',
    })
    isGrossUp: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
    })
    isUnreweight: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    noFaktur: string;

    @BelongsTo(() => Order, { foreignKey: 'order_id', as: 'order' })
    order: Order;

    @HasMany(() => OrderInvoiceDetail, { foreignKey: 'invoice_id', as: 'orderInvoiceDetails' })
    orderInvoiceDetails: OrderInvoiceDetail[];
} 