import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_delivery_notes',
    timestamps: false,
})
export class OrderDeliveryNote extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    no_delivery_note: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: true,
    })
    tanggal: Date;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    nama_pengirim: string;

    @Column({
        type: DataType.TEXT('medium'),
        allowNull: true,
    })
    alamat_pengirim: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    no_telp_pengirim: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    nama_penerima: string;

    @Column({
        type: DataType.TEXT('medium'),
        allowNull: true,
    })
    alamat_penerima: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    no_telp_penerima: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    transporter_id: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    nama_transporter: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    jenis_kendaraan: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    no_polisi: string;

    @Column({
        type: DataType.STRING(150),
        allowNull: true,
        comment: 'Nomor seal (maks 3) dipisah koma',
    })
    no_seal: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    hub_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    agent_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    hub_bypass: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    created_by: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        defaultValue: 'HUB',
        comment: 'HUB | MANIFEST',
    })
    type: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    no_tracking: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    totOrder: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    totPieceScan: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    totPieceAll: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    typeHub: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
        comment: 'untuk update dropoff TP',
    })
    updatedImage: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        comment: 'untuk update dropoff TP',
    })
    updatedLatlng: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        comment: 'untuk update dropoff TP',
    })
    updatedBy: string;
} 