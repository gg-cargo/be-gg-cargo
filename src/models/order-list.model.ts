import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'order_list',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class OrderList extends Model<OrderList> {
    @Column({
        type: DataType.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    no_tracking: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    nama_pengirim: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    alamat_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    provinsi_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kota_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kecamatan_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kelurahan_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kodepos_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    no_telepon_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    email_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    nama_penerima: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    alamat_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    provinsi_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kota_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kecamatan_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kelurahan_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    kodepos_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    no_telepon_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    email_penerima: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    status_pickup: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    nama_barang: string;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    harga_barang: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    asuransi: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    pickup_time: Date;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    total_berat: string;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    total_harga: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    status: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    payment_uuid: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    payment_type: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    payment_transaction_time: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    payment_expire_time: Date;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    payment_redirect: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    payment_status: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    reweight_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    pickup_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    is_gagal_pickup: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    order_by: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at: Date;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    actual_weight: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    volume_weight: number;

    @Column({
        type: DataType.DECIMAL(22, 0),
        allowNull: true,
    })
    pickup_scan: number;

    @Column({
        type: DataType.DECIMAL(22, 0),
        allowNull: true,
    })
    deliver_scan: number;

    @Column({
        type: DataType.DECIMAL(22, 0),
        allowNull: true,
    })
    outbound_scan: number;

    @Column({
        type: DataType.DECIMAL(22, 0),
        allowNull: true,
    })
    inbound_scan: number;

    @Column({
        type: DataType.DECIMAL(22, 0),
        allowNull: true,
    })
    hub_scan: number;

    @Column({
        type: DataType.DECIMAL(22, 0),
        allowNull: true,
    })
    reweight_scan: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    total_price: number;

    @Column({
        type: DataType.DECIMAL(65, 0),
        allowNull: true,
    })
    jumlah_koli: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    order_name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    kolom_pengirim: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    kolom_penerima: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    svc_source_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    hub_source_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    svc_dest_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    hub_dest_id: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    fm: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
    })
    lm: number;
} 