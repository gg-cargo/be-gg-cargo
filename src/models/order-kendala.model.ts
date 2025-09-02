import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_kendala',
    timestamps: false,
})
export class OrderKendala extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    order_id: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    user_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    message: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    message_completed: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Ongoing | 1: Completed',
    })
    status: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    updated_at: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    code_image_1: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    code_image_2: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    code_image_3: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    url_image_1: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    url_image_2: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    url_image_3: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    latlng: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    latlng_completed: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    location: string;
}


