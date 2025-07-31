import { Column, DataType, Model, Table, BelongsTo, ForeignKey, HasMany, HasOne, Sequelize } from 'sequelize-typescript';
import { User } from './user.model';
import { OrderShipment } from './order-shipment.model';
import { OrderPiece } from './order-piece.model';
import { OrderInvoice } from './order-invoice.model';

@Table({
    tableName: 'orders',
    timestamps: false,
})
export class Order extends Model {
    @Column({
        type: DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    no_tracking: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    nama_pengirim: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    alamat_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    provinsi_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kota_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kecamatan_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kelurahan_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kodepos_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    no_telepon_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    email_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    nama_penerima: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    alamat_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    provinsi_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kota_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kecamatan_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kelurahan_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kodepos_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
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
        allowNull: false,
    })
    harga_barang: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    asuransi: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    packing: number;

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
        allowNull: false,
        defaultValue: 0,
    })
    total_harga: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    status: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    voucher: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: 'Reguler',
    })
    layanan: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    id_kontrak: string;

    @Column({
        type: DataType.STRING(250),
        allowNull: true,
    })
    dokumen_po: string;

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
        allowNull: false,
        defaultValue: 0,
    })
    reweight_status: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    pickup_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    assign_driver: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    assign_svc: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    is_gagal_pickup: number;

    @Column({
        type: DataType.STRING(10),
        allowNull: true,
    })
    bypass_payment_check: string;

    @Column({
        type: DataType.STRING(11),
        allowNull: true,
    })
    bypass_reweight: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    min_transit_time: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    max_transit_time: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    svc_source_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_source_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    svc_dest_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    hub_dest_id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    order_by: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    promotor_by: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    pickup_by: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: '0',
    })
    deliver_by: string;

    @Column({
        type: DataType.STRING(250),
        allowNull: true,
    })
    latlngAsal: string;

    @Column({
        type: DataType.STRING(250),
        allowNull: true,
    })
    latlngTujuan: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    ferrie_id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    truck_id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    truck_xpdc_id: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    transporter_id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    transporter_konfirmasi: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    driver2_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    port_source: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    port_destination: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    port_vendor: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    orderTime: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    orderEstimate: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    surat_jalan_balik: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    distance: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    current_hub: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    next_hub: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    remark_finance: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    remark_reweight: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    remark_traffic: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    remark_sales: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    remark_sales_supabase: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    sewaTruckKoli: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    sewaTruckBerat: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    sewaTruckKubikasi: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    sewaTruckURLSJ: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    sewaTruckRAWSJ: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: 0,
    })
    payment_100: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: 0,
    })
    payment_70: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: 0,
    })
    payment_30: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    cost_100: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    cost_90: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    cost_70: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    cost_30: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    cost_10: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    id_kontrak_cost: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    metode_bayar_truck: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    total_transit: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    jarak_transit: number;

    @Column({
        type: DataType.STRING(150),
        allowNull: true,
    })
    target_tempuh: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at: Date;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: '0',
    })
    isSuratJalanBalik: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    no_referensi: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    SJName: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    SJPhone: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    SJAddress: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    SJLocation: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    SJLatlng: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    SJReturn: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    SJImagePickup: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    SJImageDeliver: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    date_start: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    date_target: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    date_end: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    total_jam: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        defaultValue: 'No',
    })
    is_rating: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    id_rating: number;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: '0',
    })
    override_cost_90: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: '0',
    })
    override_cost_70: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: '0',
    })
    override_cost_30: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: '0',
    })
    override_cost_10: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    ops_update_target: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    ops_update: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    id_channel: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    isKios: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    codeKios: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    isBypass: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    isBypassBefore: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    issetManifest: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    issetManifest_inbound: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    manifest_in_id: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    typeCustomer: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    isProblem: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    isDropoff: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    isUseToll: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
        defaultValue: 'draft',
    })
    invoiceStatus: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    isUnpaid: number;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    no_soa: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    date_submit: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    assign_sj: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    kledo_id: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    isPartialPaid: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        defaultValue: '0',
    })
    sisaAmount: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    noFaktur: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    SLA: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    isUnreweight: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    codeCampaign: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1,
    })
    isShow: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    harga_jual: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    cost_pickup: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    cost_delivery: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    countUpdateKoli: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    assign_to_checker: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    customer_by: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    billing_name: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    billing_phone: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    arr_multidrop: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    est_delivery_date: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    est_delivery_total: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    status_cost_1: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    status_cost_2: number;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        defaultValue: '0',
    })
    isUpdateMarking: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    waypoints: string;

    @Column({
        type: DataType.TEXT('long'),
        allowNull: true,
    })
    avoidLocation: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    isTolPrice: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    isTrackingUGL: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    isTrackingXENA: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    typeFTL: number;

    // Relations
    @BelongsTo(() => User, { foreignKey: 'order_by', as: 'orderUser' })
    orderUser: User;

    @HasMany(() => OrderShipment, { foreignKey: 'order_id', as: 'shipments' })
    shipments: OrderShipment[];

    @HasMany(() => OrderPiece, { foreignKey: 'order_id', as: 'pieces' })
    pieces: OrderPiece[];

    @HasOne(() => OrderInvoice, { foreignKey: 'order_id', as: 'orderInvoice' })
    orderInvoice: OrderInvoice;

    total_koli: any;
} 