import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'vendors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Vendor extends Model<Vendor> {
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    nama_vendor: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
        unique: true,
    })
    kode_vendor: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    alamat_vendor: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    pic_nama: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    pic_telepon: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    pic_email: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    jenis_layanan: string[];

    @Column({
        type: DataType.ENUM('Aktif', 'Nonaktif', 'Dalam Proses'),
        allowNull: false,
        defaultValue: 'Dalam Proses',
    })
    status_vendor: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    area_coverage: string[];

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    catatan: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 1,
    })
    aktif: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    updated_at: Date;
}

