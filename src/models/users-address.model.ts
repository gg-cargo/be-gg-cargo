import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model';

@Table({
    tableName: 'users_address',
    timestamps: false,
})
export class UsersAddress extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    id_user: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    nama: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    no_telepon: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        defaultValue: null,
    })
    email: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    alamat: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    provinsi: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kota: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kecamatan: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kelurahan: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kode_pos: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: null,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: null,
    })
    updated_at: Date;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    svc_id: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        defaultValue: null,
    })
    hub_id: string;
} 