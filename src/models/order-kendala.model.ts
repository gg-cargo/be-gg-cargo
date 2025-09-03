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
    declare order_id: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    declare user_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare message: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare message_completed: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Ongoing | 1: Completed',
    })
    declare status: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare updated_at: Date;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    declare code_image_1: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    declare code_image_2: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    declare code_image_3: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare url_image_1: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare url_image_2: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare url_image_3: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare latlng: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare latlng_completed: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare location: string;
}


