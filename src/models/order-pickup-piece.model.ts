import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import { OrderPickupDriver } from './order-pickup-driver.model';
import { Order } from './order.model';
import { OrderPiece } from './order-piece.model';

export interface OrderPickupPieceAttributes {
    id?: number;
    order_pickup_id: number;
    order_id: number;
    order_piece_id: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface OrderPickupPieceCreationAttributes extends Omit<OrderPickupPieceAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({
    tableName: 'order_pickup_pieces',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})
export class OrderPickupPiece extends Model<OrderPickupPieceAttributes, OrderPickupPieceCreationAttributes> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Index
    @ForeignKey(() => OrderPickupDriver)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_pickup_id: number;

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
    @BelongsTo(() => OrderPickupDriver, 'order_pickup_id')
    orderPickupDriver: OrderPickupDriver;

    @BelongsTo(() => Order, 'order_id')
    order: Order;

    @BelongsTo(() => OrderPiece, 'order_piece_id')
    orderPiece: OrderPiece;
}
