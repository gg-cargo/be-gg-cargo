import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import { OrderDeliverDriver } from './order-deliver-driver.model';
import { Order } from './order.model';
import { OrderPiece } from './order-piece.model';

export interface OrderDeliverPieceAttributes {
    id?: number;
    order_deliver_id: number;
    order_id: number;
    order_piece_id: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface OrderDeliverPieceCreationAttributes extends Omit<OrderDeliverPieceAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({
    tableName: 'order_deliver_pieces',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})
export class OrderDeliverPiece extends Model<OrderDeliverPieceAttributes, OrderDeliverPieceCreationAttributes> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Index
    @ForeignKey(() => OrderDeliverDriver)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_deliver_id: number;

    @Index
    @ForeignKey(() => Order)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_id: number;

    @Index
    @ForeignKey(() => OrderPiece)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_piece_id: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at?: Date;

    // Associations
    @BelongsTo(() => OrderDeliverDriver, 'order_deliver_id')
    orderDeliverDriver: OrderDeliverDriver;

    @BelongsTo(() => Order, 'order_id')
    order: Order;

    @BelongsTo(() => OrderPiece, 'order_piece_id')
    orderPiece: OrderPiece;
}
