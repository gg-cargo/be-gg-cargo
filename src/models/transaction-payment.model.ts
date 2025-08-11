import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { Order } from './order.model';

@Table({
    tableName: 'transaction_payment',
    timestamps: false,
})
export class TransactionPayment extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: false,
    })
    user_id: number;

    @ForeignKey(() => Order)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    order_id: number;

    @Column({
        type: DataType.STRING(250),
        allowNull: false,
    })
    price: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    sid: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: false,
    })
    link_payment: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    bank_code: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    no_va: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    expired_at: string;

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

    // Relationships
    @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
    user: User;

    @BelongsTo(() => Order, { foreignKey: 'order_id', as: 'order' })
    order: Order;
}
