import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'users_bank',
    timestamps: false,
})
export class UsersBank extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    id_user: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    code_bank: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    nama_bank: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    nama_pemilik_rekening: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    nomor_rekening: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    image: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
} 