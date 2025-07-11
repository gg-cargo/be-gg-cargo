import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.model';
import { OrderShipment } from './order-shipment.model';

@Table({
    tableName: 'order_pieces',
    timestamps: false,
})
export class OrderPiece extends Model {
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

    @ForeignKey(() => OrderShipment)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    order_shipment_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    manifest_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    delivery_note_id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
    })
    piece_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    marking_id: string;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    berat: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    panjang: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    lebar: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
    })
    tinggi: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    pickup_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    deliver_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    outbound_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    inbound_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_in_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    service_center_in_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_out_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    service_center_out_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_current_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_estimate_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    svc_estimate_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    reweight_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    pickup_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    courier_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    deliver_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    outbound_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    inbound_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    reweight_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    close_manifest_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_in_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_out_by: number;

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

    @BelongsTo(() => Order, { foreignKey: 'order_id', as: 'order' })
    order: Order;

    @BelongsTo(() => OrderShipment, { foreignKey: 'order_shipment_id', as: 'orderShipment' })
    orderShipment: OrderShipment;
} 