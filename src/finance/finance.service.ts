import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal, where } from 'sequelize';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { OrderInvoiceDetail } from '../models/order-invoice-detail.model';
import { Invoice } from '../models/invoice.model';
import { PaymentOrder } from '../models/payment-order.model';
import { Bank } from '../models/bank.model';
import { Quotation } from '../models/quotation.model';
import { FinanceSummaryDto } from './dto/finance-summary.dto';
import { FinanceShipmentsDto } from './dto/finance-shipments.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Transaction } from 'sequelize';
import { generateInvoicePDF } from './helpers/generate-invoice-pdf.helper';

@Injectable()
export class FinanceService {
    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderInvoice)
        private readonly orderInvoiceModel: typeof OrderInvoice,
        @InjectModel(OrderInvoiceDetail)
        private readonly orderInvoiceDetailModel: typeof OrderInvoiceDetail,
        @InjectModel(Invoice)
        private readonly invoiceModel: typeof Invoice,
        @InjectModel(PaymentOrder)
        private readonly paymentOrderModel: typeof PaymentOrder,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(OrderShipment)
        private readonly orderShipmentModel: typeof OrderShipment,
        @InjectModel(OrderPiece)
        private readonly orderPieceModel: typeof OrderPiece,
        @InjectModel(Bank)
        private readonly bankModel: typeof Bank,
        @InjectModel(Quotation)
        private readonly quotationModel: typeof Quotation,
    ) { }

    async getFinanceSummary(query: FinanceSummaryDto) {
        const { start_date, end_date, hub_id, svc_id } = query;

        // Build where conditions
        const whereCondition: any = {};
        const orderWhereCondition: any = {};

        // Date filter
        if (start_date && end_date) {
            whereCondition.created_at = {
                [Op.between]: [start_date, end_date + ' 23:59:59']
            };
            orderWhereCondition.created_at = {
                [Op.between]: [start_date, end_date + ' 23:59:59']
            };
        }

        // Hub/Service Center filter
        if (hub_id || svc_id) {
            const locationCondition: any = {};
            if (hub_id) {
                locationCondition[Op.or] = [
                    { hub_source_id: hub_id },
                    { hub_dest_id: hub_id }
                ];
            }
            if (svc_id) {
                locationCondition[Op.or] = [
                    ...(locationCondition[Op.or] || []),
                    { svc_source_id: svc_id },
                    { svc_dest_id: svc_id }
                ];
            }
            orderWhereCondition[Op.and] = [locationCondition];
        }

        try {
            // 1. Get total invoice amount from orders
            const totalInvoiceAmount = await this.orderModel.sum('total_harga', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    }
                }
            }) || 0;

            // 2. Get total paid amount from orders
            const totalPaidAmount = await this.orderModel.sum('total_harga', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    },
                    isUnpaid: 0,
                    isPartialPaid: 0
                }
            }) || 0;

            // 3. Get total unpaid amount (sisaAmount)
            const totalUnpaidAmount = await this.orderModel.sum('sisaAmount', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    },
                    [Op.or]: [
                        { isUnpaid: 1 },
                        { isPartialPaid: 1 }
                    ]
                }
            }) || 0;

            // 4. Get total partial paid amount
            const totalPartialPaidAmount = await this.orderModel.sum('sisaAmount', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    },
                    isPartialPaid: 1
                }
            }) || 0;

            // 5. Get order counts by billing status
            const orderCountsByBillingStatus = await this.getOrderCountsByBillingStatus(orderWhereCondition);

            // 6. Get revenue by service type
            const revenueByServiceType = await this.getRevenueByServiceType(orderWhereCondition);

            // 7. Get top customers by revenue
            const topCustomersByRevenue = await this.getTopCustomersByRevenue(orderWhereCondition);

            // 8. Get payment statistics from invoices table
            const paymentStats = await this.getPaymentStatistics(whereCondition);

            // 9. Get additional payment statistics from payment_order table
            const paymentOrderStats = await this.getPaymentOrderStatistics(whereCondition);

            return {
                message: 'Finance summary berhasil diambil',
                success: true,
                data: {
                    periode: start_date && end_date ? `${start_date} to ${end_date}` : 'All time',
                    total_invoice_amount: totalInvoiceAmount,
                    total_paid_amount: totalPaidAmount,
                    total_unpaid_amount: totalUnpaidAmount,
                    total_partial_paid_amount: totalPartialPaidAmount,
                    payment_rate: totalInvoiceAmount > 0 ? (totalPaidAmount / totalInvoiceAmount) * 100 : 0,
                    order_counts_by_billing_status: orderCountsByBillingStatus,
                    revenue_by_service_type: revenueByServiceType,
                    top_customers_by_revenue: topCustomersByRevenue,
                    payment_statistics: paymentStats,
                    payment_order_statistics: paymentOrderStats,
                },
            };
        } catch (error) {
            throw new Error(`Error getting finance summary: ${error.message}`);
        }
    }

    private async getOrderCountsByBillingStatus(orderWhereCondition: any) {
        const [draft, billedUnpaid, billedPartialPaid, paidInFull] = await Promise.all([
            // Draft orders
            this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: 'draft'
                }
            }),
            // Billed but unpaid
            this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    },
                    isUnpaid: 1,
                    isPartialPaid: 0
                }
            }),
            // Billed but partial paid
            this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    },
                    isPartialPaid: 1
                }
            }),
            // Paid in full
            this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: ['success', 'billed']
                    },
                    isUnpaid: 0,
                    isPartialPaid: 0
                }
            })
        ]);

        return {
            draft,
            billed_unpaid: billedUnpaid,
            billed_partial_paid: billedPartialPaid,
            paid_in_full: paidInFull
        };
    }

    private async getRevenueByServiceType(orderWhereCondition: any) {
        const revenueByService = await this.orderModel.findAll({
            attributes: [
                'layanan',
                [fn('SUM', col('total_harga')), 'total_revenue']
            ],
            where: {
                ...orderWhereCondition,
                invoiceStatus: {
                    [Op.in]: ['success', 'billed']
                }
            },
            group: ['layanan'],
            raw: true
        });

        const result: any = {};
        revenueByService.forEach(item => {
            result[item.layanan] = parseFloat((item as any).total_revenue) || 0;
        });

        return result;
    }

    private async getTopCustomersByRevenue(orderWhereCondition: any) {
        const topCustomers = await this.orderModel.findAll({
            attributes: [
                'order_by',
                [fn('SUM', col('total_harga')), 'total_billed']
            ],
            where: {
                ...orderWhereCondition,
                invoiceStatus: {
                    [Op.in]: ['success', 'billed']
                }
            },
            group: ['order_by'],
            order: [[literal('total_billed'), 'DESC']],
            limit: 10,
            raw: true
        });

        return topCustomers.map(customer => ({
            customer_id: customer.order_by,
            total_billed: parseFloat((customer as any).total_billed) || 0
        }));
    }

    private async getPaymentStatistics(whereCondition: any) {
        const [totalPayments, confirmedPayments, pendingPayments] = await Promise.all([
            // Total payments
            this.invoiceModel.count({
                where: whereCondition
            }),
            // Confirmed payments
            this.invoiceModel.count({
                where: {
                    ...whereCondition,
                    konfirmasi_bayar: 1
                }
            }),
            // Pending payments
            this.invoiceModel.count({
                where: {
                    ...whereCondition,
                    konfirmasi_bayar: 0
                }
            })
        ]);

        return {
            total_payments: totalPayments,
            confirmed_payments: confirmedPayments,
            pending_payments: pendingPayments,
            confirmation_rate: totalPayments > 0 ? (confirmedPayments / totalPayments) * 100 : 0
        };
    }

    private async getPaymentOrderStatistics(whereCondition: any) {
        // Get all payment orders for the period
        const paymentOrders = await this.paymentOrderModel.findAll({
            where: whereCondition,
            attributes: ['amount'],
            raw: true
        });

        const totalPaymentOrders = paymentOrders.length;
        const totalAmount = paymentOrders.reduce((sum, order) => {
            return sum + (parseFloat(order.amount) || 0);
        }, 0);

        return {
            total_payment_orders: totalPaymentOrders,
            total_payment_amount: totalAmount,
            average_payment_amount: totalPaymentOrders > 0 ? totalAmount / totalPaymentOrders : 0
        };
    }

    async getFinanceShipments(query: FinanceShipmentsDto) {
        const {
            page = 1,
            limit = 20,
            search,
            billing_status,
            start_date,
            end_date,
            invoice_date_start,
            invoice_date_end,
            created_by_user_id,
            sort_by = 'created_at',
            order = 'desc'
        } = query;

        // Build where conditions
        const whereCondition: any = {};

        // Search filter
        if (search) {
            whereCondition[Op.or] = [
                { no_tracking: { [Op.like]: `%${search}%` } },
                { nama_pengirim: { [Op.like]: `%${search}%` } },
                { nama_penerima: { [Op.like]: `%${search}%` } }
            ];
        }

        // Date filter
        if (start_date && end_date) {
            whereCondition.created_at = {
                [Op.between]: [start_date, end_date + ' 23:59:59']
            };
        }

        // Invoice date filter
        if (invoice_date_start && invoice_date_end) {
            whereCondition.date_submit = {
                [Op.between]: [invoice_date_start, invoice_date_end + ' 23:59:59']
            };
        }

        // Created by user filter
        if (created_by_user_id) {
            whereCondition.order_by = created_by_user_id;
        }

        // Billing status filter
        if (billing_status) {
            switch (billing_status) {
                case 'unpaid':
                    whereCondition.invoiceStatus = { [Op.in]: ['success', 'billed'] };
                    whereCondition.isUnpaid = 1;
                    whereCondition.isPartialPaid = 0;
                    break;
                case 'billed':
                    whereCondition.invoiceStatus = { [Op.in]: ['success', 'billed'] };
                    whereCondition.isUnpaid = 0;
                    break;
                case 'paid':
                    whereCondition.invoiceStatus = { [Op.in]: ['success', 'billed'] };
                    whereCondition.isUnpaid = 0;
                    whereCondition.isPartialPaid = 0;
                    break;
                case 'partial_paid':
                    whereCondition.invoiceStatus = { [Op.in]: ['success', 'billed'] };
                    whereCondition.isPartialPaid = 1;
                    break;
            }
        }

        try {
            // Get total count for pagination
            const totalItems = await this.orderModel.count({
                where: whereCondition
            });

            // Calculate pagination
            const totalPages = Math.ceil(totalItems / limit);
            const offset = (page - 1) * limit;

            // Get shipments with pagination
            const shipments = await this.orderModel.findAll({
                where: whereCondition,
                include: [
                    {
                        model: this.userModel,
                        as: 'orderUser',
                        attributes: ['name'],
                        required: false
                    },
                    {
                        model: this.orderShipmentModel,
                        as: 'shipments',
                        attributes: ['qty'],
                        required: false
                    },
                    {
                        model: this.orderPieceModel,
                        as: 'pieces',
                        attributes: ['berat', 'panjang', 'lebar', 'tinggi'],
                        required: false
                    }
                ],
                attributes: [
                    'id',
                    'no_tracking',
                    'created_at',
                    'nama_pengirim',
                    'nama_penerima',
                    'total_berat',
                    'status',
                    'invoiceStatus',
                    'isUnpaid',
                    'isPartialPaid',
                    'date_submit',
                    'order_by',
                    'total_harga',
                    'sisaAmount'
                ],
                order: [[sort_by, order.toUpperCase()]],
                limit,
                offset,
            });

            // Helper function to round numbers
            const roundToDecimals = (num: number, decimals: number = 2) => {
                return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
            };

            // Transform data
            const transformedShipments = shipments.map((shipment: any, index: number) => {
                const no = offset + index + 1;

                // Calculate total weight and volume from pieces
                let totalWeight = 0;
                let totalVolumeWeight = 0;
                let totalVolume = 0;

                // Handle pieces data
                const pieces = shipment.getDataValue('pieces') || [];

                if (pieces && pieces.length > 0) {
                    pieces.forEach((piece: any) => {
                        if (piece && piece.getDataValue('berat')) {
                            const berat = parseFloat(piece.getDataValue('berat')) || 0;
                            const panjang = parseFloat(piece.getDataValue('panjang')) || 0;
                            const lebar = parseFloat(piece.getDataValue('lebar')) || 0;
                            const tinggi = parseFloat(piece.getDataValue('tinggi')) || 0;

                            totalWeight = roundToDecimals(totalWeight + berat, 2); // Each piece = 1 item

                            // Calculate volume for this piece
                            const volume = roundToDecimals((panjang * lebar * tinggi) / 1000000, 6); // cm³ to m³
                            totalVolume = roundToDecimals(totalVolume + volume, 6);
                        }
                    });
                }

                // Calculate volume weight (250 kg/m³)
                totalVolumeWeight = roundToDecimals(totalVolume * 250, 2);

                // Use total_berat from order if available, otherwise use calculated weight
                const beratAktual = roundToDecimals(parseFloat(shipment.getDataValue('total_berat')) || totalWeight, 2);

                // Calculate volume M3
                const volumeM3 = roundToDecimals(totalVolume, 3);

                // Determine billing status
                let statusTagihan = 'Belum Ditagih';
                if (shipment.getDataValue('invoiceStatus') === 'success' || shipment.getDataValue('invoiceStatus') === 'billed') {
                    if (shipment.getDataValue('isUnpaid') === 1 && shipment.getDataValue('isPartialPaid') === 0) {
                        statusTagihan = 'Belum Bayar';
                    } else if (shipment.getDataValue('isPartialPaid') === 1) {
                        statusTagihan = 'Bayar Sebagian';
                    } else if (shipment.getDataValue('isUnpaid') === 0 && shipment.getDataValue('isPartialPaid') === 0) {
                        statusTagihan = 'Lunas';
                    } else {
                        statusTagihan = 'Sudah Ditagih';
                    }
                }

                return {
                    no,
                    order_id: shipment.getDataValue('id'),
                    resi: shipment.getDataValue('no_tracking'),
                    tgl_pengiriman: shipment.getDataValue('created_at'),
                    pengirim: shipment.getDataValue('nama_pengirim'),
                    penerima: shipment.getDataValue('nama_penerima'),
                    qty: shipment.getDataValue('shipments') ? shipment.getDataValue('shipments').reduce((sum: number, ship: any) => sum + (ship.getDataValue('qty') || 0), 0) : pieces.length,
                    berat_aktual_kg: beratAktual,
                    berat_volume_kg: totalVolumeWeight,
                    volume_m3: volumeM3,
                    status_pengiriman: shipment.getDataValue('status') || 'Pending',
                    status_tagihan: statusTagihan,
                    tgl_tagihan: shipment.getDataValue('date_submit'),
                    dibuat_oleh: shipment.getDataValue('orderUser')?.getDataValue('name') || 'Unknown',
                    total_harga: shipment.getDataValue('total_harga') || 0,
                    sisa_tagihan: shipment.getDataValue('sisaAmount') || 0,
                };
            });

            return {
                message: 'Daftar shipments berhasil diambil',
                success: true,
                data: {
                    pagination: {
                        total_items: totalItems,
                        total_pages: totalPages,
                        current_page: page,
                        items_per_page: limit
                    },
                    shipments: transformedShipments
                }
            };
        } catch (error) {
            throw new Error(`Error getting finance shipments: ${error.message}`);
        }
    }

    async getInvoiceByResi(noResi: string) {
        try {
            // Get order by no_tracking
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi },
                include: [
                    {
                        model: this.orderInvoiceModel,
                        as: 'orderInvoice',
                        include: [
                            {
                                model: this.orderInvoiceDetailModel,
                                as: 'orderInvoiceDetails'
                            }
                        ]
                    }
                ]
            });

            if (!order) {
                throw new Error('Order tidak ditemukan');
            }

            if (!order.getDataValue('orderInvoice')) {
                throw new Error('Invoice untuk order ini belum dibuat');
            }

            const invoice = order.getDataValue('orderInvoice');
            const invoiceDetails = invoice.getDataValue('orderInvoiceDetails') || [];

            // Get bank information if bank_name exists
            let bankInfo: any = null;
            if (invoice.getDataValue('bank_name')) {
                bankInfo = await this.bankModel.findOne({
                    where: { bank_name: invoice.getDataValue('bank_name') }
                });
            }

            // Calculate totals
            const subtotalLayanan = invoiceDetails.reduce((sum, detail) => {
                return sum + (detail.unit_price * detail.qty);
            }, 0);

            const diskon = invoice.getDataValue('discount') || 0;
            const ppn = invoice.getDataValue('ppn') || 0;
            const pph = invoice.getDataValue('pph') || 0;
            const totalAkhir = subtotalLayanan - diskon + ppn - pph;

            // Transform invoice details
            const itemTagihan = invoiceDetails.map(detail => ({
                deskripsi: detail.getDataValue('description'),
                qty: detail.getDataValue('qty'),
                uom: detail.getDataValue('uom'),
                harga_satuan: detail.getDataValue('unit_price'),
                total: detail.getDataValue('unit_price') * detail.getDataValue('qty')
            }));

            const response = {
                invoice_details: {
                    no_invoice: invoice.getDataValue('invoice_no'),
                    tgl_invoice: invoice.getDataValue('invoice_date'),
                    no_resi_terkait: order.getDataValue('no_tracking'),
                    syarat_pembayaran: invoice.getDataValue('payment_terms'),
                    pihak_penagih: {
                        nama_perusahaan: "PT. Xentra Logistik",
                        alamat: "Jl. Contoh No. 1, Jakarta",
                        telepon: "+628123456789"
                    },
                    ditagihkan_kepada: {
                        nama: invoice.getDataValue('bill_to_name') || order.getDataValue('nama_pengirim'),
                        telepon: invoice.getDataValue('bill_to_phone') || order.getDataValue('no_telepon_pengirim'),
                        alamat: invoice.getDataValue('bill_to_address') || order.getDataValue('alamat_pengirim')
                    },
                    detail_pengiriman: {
                        pengirim: order.getDataValue('nama_pengirim'),
                        alamat_pengirim: order.getDataValue('alamat_pengirim'),
                        penerima: order.getDataValue('nama_penerima'),
                        alamat_penerima: order.getDataValue('alamat_penerima'),
                        layanan: order.getDataValue('layanan')
                    },
                    item_tagihan: itemTagihan,
                    subtotal_layanan: subtotalLayanan,
                    diskon: diskon,
                    ppn: ppn,
                    pph: pph,
                    total_akhir_tagihan: totalAkhir,
                    kode_unik_pembayaran: invoice.getDataValue('kode_unik'),
                    status_pembayaran: invoice.getDataValue('konfirmasi_bayar') ? 'Sudah Bayar' : 'Belum Bayar',
                    info_rekening_bank: bankInfo ? {
                        nama_bank: bankInfo.getDataValue('bank_name'),
                        nama_pemilik_rek: bankInfo.getDataValue('account_name'),
                        no_rekening: bankInfo.getDataValue('no_account'),
                        swift_code: invoice.getDataValue('swift_code') || ''
                    } : {
                        nama_bank: invoice.getDataValue('bank_name'),
                        nama_pemilik_rek: invoice.getDataValue('beneficiary_name'),
                        no_rekening: invoice.getDataValue('acc_no'),
                        swift_code: invoice.getDataValue('swift_code') || ''
                    }
                }
            };

            return {
                message: 'Detail invoice berhasil diambil',
                success: true,
                data: response
            };

        } catch (error) {
            throw new Error(`Error getting invoice by resi: ${error.message}`);
        }
    }

    async createInvoice(body: CreateInvoiceDto) {
        const {
            order_ids,
            invoice_date,
            payment_terms,
            notes,
            bill_to_name,
            bill_to_phone,
            bill_to_address,
            created_by_user_id
        } = body;

        // 1. Validasi user (role finance)
        const user = await this.userModel.findByPk(created_by_user_id);
        if (!user) {
            throw new Error('User tidak berhak membuat invoice');
        }

        // 2. Validasi input
        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
            throw new Error('order_ids tidak boleh kosong');
        }
        if (!invoice_date) {
            throw new Error('invoice_date wajib diisi');
        }
        if (!payment_terms) {
            throw new Error('payment_terms wajib diisi');
        }

        // 3. Validasi status order dan pengambilan data order
        const orders = await this.orderModel.findAll({
            where: { id: order_ids },
            include: [
                { model: this.orderPieceModel, as: 'pieces' },
                { model: this.orderInvoiceModel, as: 'orderInvoice' }
            ]
        });
        if (orders.length !== order_ids.length) {
            throw new Error('Beberapa order tidak ditemukan');
        }

        // Validasi status order
        for (const order of orders) {
            if (order.getDataValue('invoiceStatus') === 'success' || order.getDataValue('invoiceStatus') === 'billed' || (order.getDataValue('orderInvoice') && order.getDataValue('orderInvoice').getDataValue('invoice_no'))) {
                throw new Error(`Order ${order.id} sudah memiliki invoice`);
            }
            // if (!(order.status === 'Delivered' || order.status === 'Completed')) {
            //     throw new Error(`Order ${order.id} belum delivered/completed`);
            // }
            if (order.getDataValue('reweight_status') !== 1) {
                throw new Error(`Order ${order.id} belum reweight final`);
            }
        }

        // 4. Ambil info bank default
        const bank = await this.bankModel.findOne();
        if (!bank) throw new Error('Info bank perusahaan belum diatur');

        // 5. Generate nomor invoice berdasarkan no_tracking order
        // Ambil order pertama untuk mendapatkan no_tracking sebagai base
        const baseOrder = orders[0];
        const baseTrackingNo = baseOrder.getDataValue('no_tracking');

        // Jika ada multiple orders, gunakan format yang berbeda
        let invoice_no: string;
        if (orders.length === 1) {
            // Single order: gunakan no_tracking langsung
            invoice_no = baseTrackingNo;
        } else {
            // Multiple orders: gunakan no_tracking order pertama + suffix
            const lastInvoice = await this.orderInvoiceModel.findOne({
                where: { invoice_no: { [Op.like]: `${baseTrackingNo}-%` } },
                order: [['invoice_no', 'DESC']]
            });
            let nextNumber = 1;
            if (lastInvoice && lastInvoice.invoice_no) {
                const match = lastInvoice.invoice_no.match(new RegExp(`${baseTrackingNo}-(\\d+)`));
                if (match) nextNumber = parseInt(match[1], 10) + 1;
            }
            invoice_no = `${baseTrackingNo}-${String(nextNumber).padStart(3, '0')}`;
        }

        // 6. Mulai transaksi
        if (!this.orderModel.sequelize) throw new Error('Sequelize instance not found');
        return await this.orderModel.sequelize.transaction(async (t: Transaction) => {
            let createdInvoices: any[] = [];
            for (const order of orders) {
                // Komponen biaya utama
                const items: {
                    description: string;
                    qty: number;
                    uom: string;
                    unit_price: number;
                    remark: string;
                }[] = [];
                // Biaya Pengiriman
                items.push({
                    description: 'Biaya Pengiriman Barang',
                    qty: 1,
                    uom: 'kg',
                    unit_price: order.total_harga || 0,
                    remark: ''
                });
                // Biaya Asuransi
                if (order.asuransi === 1) {
                    items.push({
                        description: 'Biaya Asuransi',
                        qty: 1,
                        uom: 'pcs',
                        unit_price: Math.round((order.harga_barang || 0) * 0.002), // contoh 0.2% dari harga barang
                        remark: ''
                    });
                }
                // Biaya Packing
                if (order.packing === 1) {
                    items.push({
                        description: 'Biaya Packing',
                        qty: 1,
                        uom: 'pcs',
                        unit_price: 5000, // flat, bisa diambil dari config
                        remark: ''
                    });
                }
                // Diskon (jika ada)
                if (order.voucher) {
                    items.push({
                        description: 'Diskon',
                        qty: 1,
                        uom: 'voucher',
                        unit_price: -10000, // contoh, bisa diambil dari order
                        remark: order.voucher
                    });
                }
                // Subtotal
                const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
                // Pajak
                const ppn = Math.round(subtotal * 0.1); // 10% PPN
                const pph = 0; // default 0, bisa diatur sesuai kebutuhan
                const kode_unik = Math.floor(100 + Math.random() * 900); // 3 digit random
                const total = subtotal + ppn - pph;

                // Insert ke order_invoices
                const invoice = await this.orderInvoiceModel.create({
                    order_id: order.id,
                    invoice_no,
                    invoice_date,
                    payment_terms,
                    vat: ppn,
                    discount: 0,
                    packing: order.packing,
                    asuransi: order.asuransi,
                    ppn,
                    pph,
                    kode_unik,
                    notes,
                    beneficiary_name: bank.account_name,
                    acc_no: bank.no_account,
                    bank_name: bank.bank_name,
                    bank_address: '',
                    swift_code: '',
                    payment_info: 0,
                    fm: 0,
                    lm: 0,
                    bill_to_name: bill_to_name || order.getDataValue('billing_name') || order.getDataValue('nama_pengirim'),
                    bill_to_phone: bill_to_phone || order.getDataValue('billing_phone') || order.getDataValue('no_telepon_pengirim'),
                    bill_to_address: bill_to_address || order.getDataValue('billing_address') || order.getDataValue('alamat_pengirim'),
                    create_date: new Date(),
                    noFaktur: '',
                }, { transaction: t });

                // Insert ke order_invoice_details
                for (const item of items) {
                    await this.orderInvoiceDetailModel.create({
                        invoice_id: invoice.id,
                        description: item.description || '',
                        qty: item.qty || 0,
                        uom: item.uom || '',
                        unit_price: item.unit_price || 0,
                        remark: item.remark || ''
                    }, { transaction: t });
                }

                // Update status order
                await order.update({
                    invoiceStatus: 'billed',
                    isUnpaid: 1,
                    date_submit: invoice_date,
                    noFaktur: invoice_no
                }, { transaction: t });

                createdInvoices.push(invoice);
            }
            return {
                message: 'Invoice berhasil dibuat',
                success: true,
                data: createdInvoices.map(inv => ({
                    invoice_no: inv.invoice_no,
                    order_id: inv.order_id,
                    invoice_date: inv.invoice_date
                }))
            };
        });
    }

    async getInvoicePDFByResi(noResi: string) {
        try {
            // Get invoice data first
            const invoiceData = await this.getInvoiceByResi(noResi);

            if (!invoiceData.success) {
                throw new Error('Invoice tidak ditemukan');
            }

            // Generate PDF
            const pdfPath = await generateInvoicePDF(invoiceData.data);

            return {
                message: 'PDF invoice berhasil dibuat',
                success: true,
                data: {
                    pdf_url: pdfPath,
                    invoice_no: invoiceData.data.invoice_details.no_invoice
                }
            };

        } catch (error) {
            throw new Error(`Error generating invoice PDF: ${error.message}`);
        }
    }

    async getInvoiceByInvoiceNo(invoiceNo: string) {
        try {
            // Get invoice by invoice_no
            const invoice = await this.orderInvoiceModel.findOne({
                where: { invoice_no: invoiceNo },
                include: [
                    {
                        model: this.orderInvoiceDetailModel,
                        as: 'orderInvoiceDetails'
                    },
                    {
                        model: this.orderModel,
                        as: 'order',
                        include: [
                            {
                                model: this.orderPieceModel,
                                as: 'pieces'
                            }
                        ]
                    }
                ]
            });

            if (!invoice) {
                throw new Error('Invoice tidak ditemukan');
            }

            const order = invoice.getDataValue('order');
            const invoiceDetails = invoice.getDataValue('orderInvoiceDetails') || [];
            const pieces = order.getDataValue('pieces') || [];

            // Calculate kubikasi from pieces
            let kubikasi = 0;
            if (pieces.length > 0) {
                pieces.forEach((piece: any) => {
                    const panjang = parseFloat(piece.getDataValue('panjang')) || 0;
                    const lebar = parseFloat(piece.getDataValue('lebar')) || 0;
                    const tinggi = parseFloat(piece.getDataValue('tinggi')) || 0;
                    kubikasi += (panjang * lebar * tinggi) / 1000000; // cm³ to m³
                });
            }

            // Get quotation info if exists
            let quotationInfo: any = null;
            if (order.getDataValue('id_kontrak')) {
                quotationInfo = await this.quotationModel.findOne({
                    where: { no_quotation: order.getDataValue('id_kontrak') }
                });
            }

            // Get payment info if exists
            const paymentInfo = await this.paymentOrderModel.findOne({
                where: { order_id: order.id }
            });

            // Format date
            const formatDate = (dateStr: string) => {
                const d = new Date(dateStr);
                return d.toLocaleDateString('id-ID');
            };

            // Calculate totals
            const subtotal = invoiceDetails.reduce((sum: number, detail: any) => {
                return sum + (detail.getDataValue('unit_price') * detail.getDataValue('qty'));
            }, 0);

            const ppnAmount = invoice.getDataValue('ppn') || 0;
            const pphAmount = invoice.getDataValue('pph') || 0;
            const totalAll = subtotal + ppnAmount - pphAmount;

            const response = {
                invoice_data: {
                    invoice_no: invoice.getDataValue('invoice_no'),
                    invoice_date: formatDate(invoice.getDataValue('invoice_date')),
                    payment_terms: invoice.getDataValue('payment_terms'),
                    status_payment: order.getDataValue('invoiceStatus') === 'success' ? 'Paid' : 'Billed',
                    paid_from_bank: paymentInfo ? paymentInfo.getDataValue('bank_name') : null,
                    contract_quotation: quotationInfo ? quotationInfo.getDataValue('no_quotation') : null,

                    shipment_details: {
                        tracking_no: order.getDataValue('no_tracking'),
                        shipper: {
                            name: order.getDataValue('nama_pengirim'),
                            address: order.getDataValue('alamat_pengirim'),
                            area: `${order.getDataValue('kelurahan_pengirim')}, ${order.getDataValue('kecamatan_pengirim')}, ${order.getDataValue('kota_pengirim')}, ${order.getDataValue('provinsi_pengirim')}, ${order.getDataValue('kodepos_pengirim')}`
                        },
                        layanan: order.getDataValue('layanan'),
                        item_summary: {
                            nama_barang: order.getDataValue('nama_barang'),
                            jumlah_koli: pieces.length,
                            berat_actual_kg: parseFloat(order.getDataValue('total_berat')) || 0,
                            berat_volume_kg: parseFloat(order.getDataValue('total_berat')) || 0, // Assuming same as actual weight
                            berat_kubikasi_m3: Math.round(kubikasi * 1000) / 1000
                        },
                        status_pengiriman: order.getDataValue('status'),
                        consignee: {
                            name: order.getDataValue('nama_penerima'),
                            address: order.getDataValue('alamat_penerima'),
                            area: `${order.getDataValue('kelurahan_penerima')}, ${order.getDataValue('kecamatan_penerima')}, ${order.getDataValue('kota_penerima')}, ${order.getDataValue('provinsi_penerima')}, ${order.getDataValue('kodepos_penerima')}`
                        }
                    },

                    billing_items: invoiceDetails.map((detail: any) => ({
                        description: detail.getDataValue('description'),
                        quantity: detail.getDataValue('qty'),
                        uom: detail.getDataValue('uom'),
                        unit_price: detail.getDataValue('unit_price'),
                        total: detail.getDataValue('unit_price') * detail.getDataValue('qty'),
                        remarks: detail.getDataValue('remark')
                    })),

                    discount_voucher_contract: invoice.getDataValue('discount') || 0,
                    additional_fees: [],
                    asuransi_amount: invoice.getDataValue('asuransi') || 0,
                    packing_amount: invoice.getDataValue('packing') || 0,
                    pph_percentage: 2,
                    pph_amount: pphAmount,
                    ppn_percentage: 11,
                    ppn_amount: ppnAmount,
                    gross_up: invoice.getDataValue('isGrossUp') === 1,
                    total_all: totalAll,

                    pay_information: {
                        beneficiary_name: invoice.getDataValue('beneficiary_name'),
                        bank_name: invoice.getDataValue('bank_name'),
                        acc_no: invoice.getDataValue('acc_no'),
                        swift_code: invoice.getDataValue('swift_code')
                    },
                    invoice_notes: invoice.getDataValue('notes')
                }
            };

            return {
                message: 'Detail invoice berhasil diambil',
                success: true,
                data: response
            };

        } catch (error) {
            throw new Error(`Error getting invoice by invoice no: ${error.message}`);
        }
    }

    async updateInvoice(invoiceNo: string, body: UpdateInvoiceDto) {
        const {
            status_payment,
            payment_amount,
            payment_date,
            payment_method,
            paid_attachment_url,
            payment_terms,
            notes,
            update_items,
            updated_by_user_id
        } = body;

        try {
            // 1. Validasi user (role finance)
            const user = await this.userModel.findByPk(updated_by_user_id);
            if (!user) { // misal level 3 = finance
                throw new Error('User tidak berhak mengupdate invoice');
            }

            // 2. Validasi invoice exists
            const invoice = await this.orderInvoiceModel.findOne({
                where: { invoice_no: invoiceNo },
                include: [
                    {
                        model: this.orderModel,
                        as: 'order'
                    }
                ]
            });

            if (!invoice) {
                throw new Error('Invoice tidak ditemukan');
            }

            const order = invoice.getDataValue('order');

            // 3. Mulai transaksi
            if (!this.orderModel.sequelize) throw new Error('Sequelize instance not found');
            return await this.orderModel.sequelize.transaction(async (t: Transaction) => {
                const updateHistory: string[] = [];

                // 4. Update Payment Status
                if (status_payment) {
                    const oldStatus = order.getDataValue('invoiceStatus');
                    let newStatus = oldStatus;
                    let isUnpaid = order.getDataValue('isUnpaid');
                    let isPartialPaid = order.getDataValue('isPartialPaid');
                    let sisaAmount = order.getDataValue('sisaAmount');

                    switch (status_payment) {
                        case 'paid':
                            newStatus = 'success';
                            isUnpaid = 0;
                            isPartialPaid = 0;
                            sisaAmount = 0;
                            break;
                        case 'partial_paid':
                            newStatus = 'success';
                            isUnpaid = 0;
                            isPartialPaid = 1;
                            sisaAmount = Math.max(0, parseFloat(order.getDataValue('total_harga')) - (payment_amount || 0));
                            break;
                        case 'unpaid':
                            newStatus = 'billed';
                            isUnpaid = 1;
                            isPartialPaid = 0;
                            sisaAmount = order.getDataValue('total_harga');
                            break;
                        case 'cancelled':
                            newStatus = 'cancelled';
                            isUnpaid = 1;
                            isPartialPaid = 0;
                            sisaAmount = order.getDataValue('total_harga');
                            break;
                    }

                    // Update order status
                    await order.update({
                        invoiceStatus: newStatus,
                        isUnpaid,
                        isPartialPaid,
                        sisaAmount: sisaAmount.toString()
                    }, { transaction: t });

                    // Update invoice payment status
                    await invoice.update({
                        konfirmasi_bayar: status_payment === 'paid' ? 1 : 0,
                        paid_attachment: paid_attachment_url || null
                    }, { transaction: t });

                    // Create payment order record if payment received
                    if (status_payment === 'paid' || status_payment === 'partial_paid') {
                        await this.paymentOrderModel.create({
                            order_id: order.id,
                            no_tracking: order.getDataValue('no_tracking'),
                            amount: payment_amount || 0,
                            bank_name: payment_method || 'Transfer Bank',
                            payment_date: payment_date || new Date(),
                            user_id: updated_by_user_id
                        }, { transaction: t });
                    }

                    updateHistory.push(`Status pembayaran diubah dari ${oldStatus} ke ${newStatus}`);
                }

                // 5. Update General Invoice Data
                if (payment_terms || notes) {
                    const updateData: any = {};
                    if (payment_terms) updateData.payment_terms = payment_terms;
                    if (notes) updateData.notes = notes;

                    await invoice.update(updateData, { transaction: t });
                    updateHistory.push('Data umum invoice diperbarui');
                }

                // 6. Update Invoice Items
                if (update_items && update_items.length > 0) {
                    for (const item of update_items) {
                        const invoiceDetail = await this.orderInvoiceDetailModel.findByPk(item.invoice_detail_id);
                        if (invoiceDetail) {
                            const oldData = {
                                description: invoiceDetail.getDataValue('description'),
                                quantity: invoiceDetail.getDataValue('qty'),
                                unit_price: invoiceDetail.getDataValue('unit_price')
                            };

                            await invoiceDetail.update({
                                description: item.description || invoiceDetail.getDataValue('description'),
                                qty: item.quantity || invoiceDetail.getDataValue('qty'),
                                uom: item.uom || invoiceDetail.getDataValue('uom'),
                                unit_price: item.unit_price || invoiceDetail.getDataValue('unit_price'),
                                remark: item.remarks || invoiceDetail.getDataValue('remark')
                            }, { transaction: t });

                            updateHistory.push(`Item "${oldData.description}" diperbarui`);
                        }
                    }

                    // Recalculate invoice totals
                    const updatedDetails = await this.orderInvoiceDetailModel.findAll({
                        where: { invoice_id: invoice.id }
                    });

                    const subtotal = updatedDetails.reduce((sum, detail) => {
                        return sum + (detail.getDataValue('unit_price') * detail.getDataValue('qty'));
                    }, 0);

                    const ppn = Math.round(subtotal * 0.1); // 10% PPN
                    const pph = 0; // default 0
                    const total = subtotal + ppn - pph;

                    await invoice.update({
                        vat: ppn,
                        ppn,
                        pph,
                        total
                    }, { transaction: t });

                    updateHistory.push('Total invoice dihitung ulang');
                }

                // 7. Create audit trail
                if (updateHistory.length > 0) {
                    // Note: OrderHistory model should be injected if needed
                    // For now, we'll skip audit trail creation
                    console.log('Audit trail:', {
                        order_id: order.id,
                        status: 'Invoice Updated',
                        remark: updateHistory.join('; '),
                        created_by: updated_by_user_id
                    });
                }

                return {
                    message: 'Invoice berhasil diperbarui',
                    success: true,
                    data: {
                        invoice_no: invoiceNo,
                        updates: updateHistory
                    }
                };

            });

        } catch (error) {
            throw new Error(`Error updating invoice: ${error.message}`);
        }
    }
} 