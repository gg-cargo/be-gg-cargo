import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'service_centers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
})
export class ServiceCenter extends Model<ServiceCenter> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    hub_id: number;

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
        type: DataType.STRING(50),
        allowNull: true,
    })
    agent_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        defaultValue: '0,0',
    })
    latlng: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    zone: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;
} 