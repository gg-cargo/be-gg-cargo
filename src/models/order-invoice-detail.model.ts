import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { OrderInvoice } from './order-invoice.model';

@Table({
    tableName: 'order_invoice_details',
    timestamps: false,
})
export class OrderInvoiceDetail extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ForeignKey(() => OrderInvoice)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    invoice_id: number;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    description: string;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    qty: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    uom: string;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    unit_price: number;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    remark: string;

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

    @BelongsTo(() => OrderInvoice, { foreignKey: 'invoice_id', as: 'invoice' })
    invoice: OrderInvoice;
} 