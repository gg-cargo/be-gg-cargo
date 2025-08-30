import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_manifest_inbound',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
})
export class OrderManifestInbound extends Model<OrderManifestInbound> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    order_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    svc_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    user_id: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
}
