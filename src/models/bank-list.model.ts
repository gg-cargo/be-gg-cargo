import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'bank_list',
    timestamps: false,
})
export class BankList extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    code: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    nama: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    image: string;
} 