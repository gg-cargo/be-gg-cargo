import { Column, DataType, Model, Table, BelongsTo, ForeignKey, HasMany, HasOne, Sequelize } from 'sequelize-typescript';
import { User } from './user.model';
import { OrderShipment } from './order-shipment.model';
import { OrderPiece } from './order-piece.model';
import { OrderInvoice } from './order-invoice.model';
import { TransactionPayment } from './transaction-payment.model';
import { Hub } from './hub.model';
import { OrderKendala } from './order-kendala.model';
import { INVOICE_STATUS } from '../common/constants/invoice-status.constants';

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
        unique: true,
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
        allowNull: true,
    })
    provinsi_pengirim: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
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
        allowNull: true,
    })
    provinsi_penerima: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
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
        type: DataType.STRING(20),
        allowNull: true,
    })
    status_deliver: string;

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
        type: DataType.STRING(100),
        allowNull: true,
    })
    model_motor: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    no_polisi_motor: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    besaran_cc: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    motor_type: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    motor_notes: string;

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
        type: DataType.STRING(25),
        allowNull: true,
    })
    sales_referral_code: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: true,
    })
    referred_by_sales_id: number;

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
        type: DataType.STRING(200),
        allowNull: true,
    })
    truck_type: string;

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
        allowNull: false,
        defaultValue: 0,
    })
    issetManifest_outbound: number;

    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: true,
    })
    vendor_id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        comment: 'Nomor resi/A-Waybill dari vendor (JNE/TIKI/FTL, dll)'
    })
    vendor_tracking_number: string;

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
        defaultValue: INVOICE_STATUS.BELUM_PROSES,
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
        type: DataType.STRING(255),
        allowNull: true,
    })
    billing_email: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    billing_address: string;

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

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    total_kubikasi: number;

    // International Order Fields
    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    tipe_pengiriman: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    jenis_pengirim: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    negara_pengirim: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    peb_number: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    jenis_penerima: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: true,
    })
    negara_penerima: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    incoterms: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    penagih_email: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    penagih_kodepos: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    penagih_kota: string;

    @Column({
        type: DataType.STRING(150),
        allowNull: true,
    })
    penagih_nama_pt: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    penagih_negara: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    penagih_phone: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: true,
    })
    kodepos_internasional: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    hs_code: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    country_of_origin: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    total_item_value_usd: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    customs_notes: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    commercial_invoice: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    packing_list: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    certificate_of_origin: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    chargeable_weight_total: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    order_type: string;

    // Relations
    @BelongsTo(() => User, { foreignKey: 'order_by', as: 'orderUser' })
    orderUser: User;

    @BelongsTo(() => User, { foreignKey: 'referred_by_sales_id', as: 'salesReferrer' })
    salesReferrer: User;

    @BelongsTo(() => Hub, { foreignKey: 'hub_dest_id', as: 'hubDestination' })
    hubDestination: Hub;

    @BelongsTo(() => Hub, { foreignKey: 'hub_source_id', as: 'hubSource' })
    hubSource: Hub;

    @BelongsTo(() => Hub, { foreignKey: 'next_hub', as: 'hubNext' })
    hubNext: Hub;

    @HasMany(() => OrderShipment, { foreignKey: 'order_id', as: 'shipments' })
    shipments: OrderShipment[];

    @HasMany(() => OrderPiece, { foreignKey: 'order_id', as: 'pieces' })
    pieces: OrderPiece[];

    @HasMany(() => OrderKendala, { foreignKey: 'order_id', as: 'kendala', sourceKey: 'no_tracking' })
    kendala: OrderKendala[];

    @HasOne(() => OrderInvoice, { foreignKey: 'order_id', as: 'orderInvoice' })
    orderInvoice: OrderInvoice;

    @HasMany(() => TransactionPayment, { foreignKey: 'order_id', as: 'transactionPayments' })
    transactionPayments: TransactionPayment[];

    total_koli: any;
} 