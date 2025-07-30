import { Table, Column, Model, DataType, CreatedAt } from 'sequelize-typescript';

@Table({
    tableName: 'log_gps',
    timestamps: false,
})
export class LogGps extends Model<LogGps> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    declare user_id: string | null;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    declare latlng: string | null;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    declare type: string | null;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
        defaultValue: null,
    })
    declare ip_address: string | null;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
        defaultValue: null,
    })
    declare provider: string | null;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
        defaultValue: null,
    })
    declare country: string | null;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    declare created_at: Date;
} 