import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'banks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Bank extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    no_account: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    account_name: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    bank_name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    image: string;

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
} 