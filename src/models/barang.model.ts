import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'barang',
    timestamps: true,
    underscored: true,
})
export class Barang extends Model<Barang> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    nama_barang: string;
}
