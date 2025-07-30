import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'hubs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
})
export class Hub extends Model<Hub> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kode: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    nama: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    alamat: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
    })
    phone: string;

    @Column({
        type: DataType.STRING(250),
        allowNull: true,
    })
    lokasi: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    latLang: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    group_id: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    src_sound: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    code_dn: string;
} 