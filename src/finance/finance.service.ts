import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { RevenueSummaryByServiceDto } from './dto/revenue-summary-by-service.dto';
import { RevenueSummaryByServiceResponseDto, ServiceSummaryDto, GrandTotalDto } from './dto/revenue-summary-response.dto';
import { Transaction } from 'sequelize';
import { generateInvoicePDF } from './helpers/generate-invoice-pdf.helper';
import { INVOICE_STATUS } from '../common/constants/invoice-status.constants';

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
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
                    }
                }
            }) || 0;

            // 2. Get total paid amount from orders
            const totalPaidAmount = await this.orderModel.sum('total_harga', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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

            // 10. Get total pembayaran untuk draft (belum ditagih)
            const totalDraftAmount = await this.orderModel.sum('total_harga', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH
                }
            }) || 0;

            // 11. Get total pembayaran untuk pending (sudah ditagih)
            const totalPendingAmount = await this.orderModel.sum('total_harga', {
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: INVOICE_STATUS.SUDAH_DITAGIH
                }
            }) || 0;

            // 12. Get count untuk draft dan pending
            const draftCount = await this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH
                }
            });

            const pendingCount = await this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: INVOICE_STATUS.SUDAH_DITAGIH
                }
            });

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
                    total_pembayaran: {
                        draft: {
                            count: draftCount,
                            amount: totalDraftAmount
                        },
                        pending: {
                            count: pendingCount,
                            amount: totalPendingAmount
                        }
                    }
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
                    invoiceStatus: INVOICE_STATUS.BELUM_PROSES
                }
            }),
            // Billed but unpaid
            this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
                    },
                    isPartialPaid: 1
                }
            }),
            // Paid in full
            this.orderModel.count({
                where: {
                    ...orderWhereCondition,
                    invoiceStatus: {
                        [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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
                    [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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
                    [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS]
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
            layanan,
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

        // Layanan filter
        if (layanan) {
            whereCondition.layanan = { [Op.like]: `%${layanan}%` };
        }

        // Billing status filter
        if (billing_status) {
            switch (billing_status) {
                case 'unpaid':
                    whereCondition.invoiceStatus = { [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS] };
                    whereCondition.isUnpaid = 1;
                    whereCondition.isPartialPaid = 0;
                    break;
                case 'billed':
                    whereCondition.invoiceStatus = { [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS] };
                    whereCondition.isUnpaid = 0;
                    break;
                case 'paid':
                    whereCondition.invoiceStatus = { [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS] };
                    whereCondition.isUnpaid = 0;
                    whereCondition.isPartialPaid = 0;
                    break;
                case 'partial_paid':
                    whereCondition.invoiceStatus = { [Op.in]: [INVOICE_STATUS.SUDAH_DITAGIH, INVOICE_STATUS.LUNAS] };
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
                    },
                    {
                        model: this.orderInvoiceModel,
                        as: 'orderInvoice',
                        attributes: ['invoice_date'],
                        required: false
                    }
                ],
                attributes: [
                    'id',
                    'no_tracking',
                    'created_at',
                    'nama_pengirim',
                    'nama_penerima',
                    'nama_barang',
                    'layanan',
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

                return {
                    no,
                    order_id: shipment.getDataValue('id'),
                    resi: shipment.getDataValue('no_tracking'),
                    tgl_pengiriman: shipment.getDataValue('created_at'),
                    pengirim: shipment.getDataValue('nama_pengirim'),
                    penerima: shipment.getDataValue('nama_penerima'),
                    barang: shipment.getDataValue('nama_barang') || '-',
                    layanan: shipment.getDataValue('layanan') || 'Regular',
                    qty: shipment.getDataValue('shipments') ? shipment.getDataValue('shipments').reduce((sum: number, ship: any) => sum + (ship.getDataValue('qty') || 0), 0) : pieces.length,
                    berat: `${beratAktual} Kg`,
                    koli: `${pieces.length} Qty`,
                    harga: `Rp${(shipment.getDataValue('total_harga') || 0).toLocaleString('id-ID')}`,
                    berat_aktual_kg: beratAktual,
                    berat_volume_kg: totalVolumeWeight,
                    volume_m3: volumeM3,
                    pengiriman: shipment.getDataValue('status'),
                    status_tagihan: shipment.getDataValue('invoiceStatus'),
                    tgl_tagihan: shipment.getDataValue('orderInvoice')?.getDataValue('invoice_date') || shipment.getDataValue('date_submit'),
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
            if (order.getDataValue('invoiceStatus') === INVOICE_STATUS.SUDAH_DITAGIH || order.getDataValue('invoiceStatus') === INVOICE_STATUS.LUNAS || (order.getDataValue('orderInvoice') && order.getDataValue('orderInvoice').getDataValue('invoice_no'))) {
                throw new Error(`Order ${order.id} sudah memiliki invoice`);
            }
            // if (!(order.status === 'Delivered' || order.status === 'Completed')) {
            //     throw new Error(`Order ${order.id} belum delivered/completed`);
            // }
            // if (order.getDataValue('reweight_status') !== 1) {
            //     throw new Error(`Order ${order.id} belum reweight final`);
            // }
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
                    invoiceStatus: INVOICE_STATUS.SUDAH_DITAGIH,
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
                    status_invoice: order.getDataValue('invoiceStatus'),
                    status_payment: order.getDataValue('invoiceStatus') === INVOICE_STATUS.LUNAS ? 'lunas' : 'ditagihkan',
                    paid_from_bank: this.extractBankFromNotes(invoice.getDataValue('notes')) || (paymentInfo ? paymentInfo.getDataValue('bank_name') : null),
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

                    billing_items: invoiceDetails
                        .filter((detail: any) => detail.getDataValue('description') === 'Biaya Pengiriman Barang')
                        .map((detail: any) => ({
                            description: detail.getDataValue('description'),
                            quantity: detail.getDataValue('qty'),
                            uom: detail.getDataValue('uom'),
                            unit_price: detail.getDataValue('unit_price'),
                            total: detail.getDataValue('unit_price') * detail.getDataValue('qty'),
                            remarks: detail.getDataValue('remark')
                        })),

                    discount_voucher_contract: invoice.getDataValue('discount') || 0,
                    additional_fees: invoiceDetails
                        .filter((detail: any) => detail.getDataValue('description') !== 'Biaya Pengiriman Barang')
                        .map((detail: any) => ({
                            description: detail.getDataValue('description'),
                            quantity: detail.getDataValue('qty'),
                            uom: detail.getDataValue('uom'),
                            unit_price: detail.getDataValue('unit_price'),
                            total: detail.getDataValue('unit_price') * detail.getDataValue('qty'),
                            remarks: detail.getDataValue('remark')
                        })),
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
            invoice_date,
            payment_terms,
            status_payment,
            payment_amount,
            payment_date,
            payment_method,
            paid_attachment_url,
            paid_from_bank,
            contract_quotation,
            billing_items,
            discount_voucher_contract,
            asuransi_amount,
            packing_amount,
            pph_percentage,
            pph_amount,
            ppn_percentage,
            ppn_amount,
            gross_up,
            total_all,
            notes,
            updated_by_user_id
        } = body;

        try {
            // 1. Validasi user (role finance)
            const user = await this.userModel.findByPk(updated_by_user_id);
            if (!user) {
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

            // Get payment info if exists
            const paymentInfo = await this.paymentOrderModel.findOne({
                where: {
                    order_id: order.id.toString(),
                    no_tracking: order.getDataValue('no_tracking')
                },
                order: [['created_at', 'DESC']]
            });

            // 3. Mulai transaksi
            if (!this.orderModel.sequelize) throw new Error('Sequelize instance not found');
            return await this.orderModel.sequelize.transaction(async (t: Transaction) => {
                const updateHistory: string[] = [];

                // 4. Update Invoice Date
                if (invoice_date) {
                    await invoice.update({
                        invoice_date: new Date(invoice_date)
                    }, { transaction: t });
                    updateHistory.push('Tanggal invoice diperbarui');
                }

                // 5. Update Payment Terms
                if (payment_terms) {
                    await invoice.update({
                        payment_terms
                    }, { transaction: t });
                    updateHistory.push('Payment terms diperbarui');
                }

                // 6. Update Payment Status
                if (status_payment) {
                    const oldStatus = order.getDataValue('invoiceStatus');
                    let newStatus = oldStatus;
                    let isUnpaid = order.getDataValue('isUnpaid');
                    let isPartialPaid = order.getDataValue('isPartialPaid');
                    let sisaAmount = order.getDataValue('sisaAmount');

                    switch (status_payment) {
                        case 'lunas':
                            newStatus = INVOICE_STATUS.LUNAS;
                            isUnpaid = 0;
                            isPartialPaid = 0;
                            sisaAmount = 0;
                            break;
                        case 'ditagihkan':
                            newStatus = INVOICE_STATUS.SUDAH_DITAGIH;
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
                        konfirmasi_bayar: status_payment === 'lunas' ? 1 : 0,
                        paid_attachment: paid_attachment_url || null
                    }, { transaction: t });

                    // Create payment order record if payment received
                    if (status_payment === 'lunas') {
                        const paymentOrderId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                        await this.paymentOrderModel.create({
                            id: paymentOrderId,
                            order_id: order.id.toString(),
                            no_tracking: order.getDataValue('no_tracking'),
                            amount: (payment_amount || order.getDataValue('total_harga')).toString(),
                            bank_name: paid_from_bank || payment_method || 'Transfer Bank',
                            user_id: updated_by_user_id.toString(),
                            date: new Date(payment_date || Date.now()).toISOString().split('T')[0],
                            created_at: new Date()
                        }, { transaction: t });
                    }

                    updateHistory.push(`Status pembayaran diubah dari ${oldStatus} ke ${newStatus}`);
                }

                // 7. Update Payment Details
                if (paid_from_bank) {
                    // Store paid_from_bank in notes field temporarily
                    const currentNotes = invoice.getDataValue('notes') || '';
                    const bankInfo = `Bank Pembayaran: ${paid_from_bank}`;
                    const updatedNotes = currentNotes ? `${currentNotes}\n${bankInfo}` : bankInfo;

                    await invoice.update({
                        notes: updatedNotes
                    }, { transaction: t });
                    updateHistory.push('Bank pembayaran diperbarui');
                } else if (paymentInfo && status_payment === 'lunas') {
                    // Auto-fill paid_from_bank from paymentInfo if not provided
                    const bankNameFromPayment = paymentInfo.getDataValue('bank_name');
                    if (bankNameFromPayment) {
                        const currentNotes = invoice.getDataValue('notes') || '';
                        const bankInfo = `Bank Pembayaran: ${bankNameFromPayment}`;
                        const updatedNotes = currentNotes ? `${currentNotes}\n${bankInfo}` : bankInfo;

                        await invoice.update({
                            notes: updatedNotes
                        }, { transaction: t });
                        updateHistory.push(`Bank pembayaran otomatis diisi: ${bankNameFromPayment}`);
                    }
                }

                // 8. Update Contract & Quotation
                if (contract_quotation) {
                    await invoice.update({
                        contract_quotation
                    }, { transaction: t });
                    updateHistory.push('Contract quotation diperbarui');
                }

                // 9. Update Billing Items
                if (billing_items && billing_items.length > 0) {
                    // Delete existing invoice details
                    await this.orderInvoiceDetailModel.destroy({
                        where: { invoice_id: invoice.id },
                        transaction: t
                    });

                    // Create new invoice details
                    for (const item of billing_items) {
                        await this.orderInvoiceDetailModel.create({
                            invoice_id: invoice.id,
                            description: item.description,
                            qty: item.quantity,
                            uom: item.uom,
                            unit_price: item.unit_price,
                            remark: item.remarks || ''
                        }, { transaction: t });
                    }

                    updateHistory.push('Billing items diperbarui');
                }

                // 10. Update Additional Charges
                const additionalCharges: any = {};
                if (discount_voucher_contract !== undefined) {
                    additionalCharges.discount = discount_voucher_contract;
                    updateHistory.push('Discount voucher contract diperbarui');
                }
                if (asuransi_amount !== undefined) {
                    additionalCharges.asuransi = asuransi_amount;
                    updateHistory.push('Asuransi amount diperbarui');
                }
                if (packing_amount !== undefined) {
                    additionalCharges.packing = packing_amount;
                    updateHistory.push('Packing amount diperbarui');
                }

                if (Object.keys(additionalCharges).length > 0) {
                    await invoice.update(additionalCharges, { transaction: t });
                }

                // 11. Update Tax Configuration
                const taxConfig: any = {};
                if (pph_percentage !== undefined) {
                    taxConfig.pph_percentage = pph_percentage;
                    updateHistory.push('PPH percentage diperbarui');
                }
                if (pph_amount !== undefined) {
                    taxConfig.pph = pph_amount;
                    updateHistory.push('PPH amount diperbarui');
                }
                if (ppn_percentage !== undefined) {
                    taxConfig.ppn_percentage = ppn_percentage;
                    updateHistory.push('PPN percentage diperbarui');
                }
                if (ppn_amount !== undefined) {
                    taxConfig.ppn = ppn_amount;
                    updateHistory.push('PPN amount diperbarui');
                }

                if (Object.keys(taxConfig).length > 0) {
                    await invoice.update(taxConfig, { transaction: t });
                }

                // 12. Update Gross Up
                if (gross_up !== undefined) {
                    await invoice.update({
                        gross_up: gross_up ? 1 : 0
                    }, { transaction: t });
                    updateHistory.push('Gross up diperbarui');
                }

                // 14. Update Notes
                if (notes) {
                    await invoice.update({
                        notes
                    }, { transaction: t });
                    updateHistory.push('Notes diperbarui');
                }

                // 15. Create audit trail
                if (updateHistory.length > 0) {
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

    async getRevenueSummaryByService(query: RevenueSummaryByServiceDto): Promise<RevenueSummaryByServiceResponseDto> {
        const { start_date, end_date, hub_id, layanan } = query;

        // Build where conditions
        const whereCondition: any = {};

        // Date filter
        if (start_date && end_date) {
            whereCondition.created_at = {
                [Op.between]: [start_date, end_date + ' 23:59:59']
            };
        }

        // Hub filter
        if (hub_id) {
            whereCondition.hub_source_id = hub_id;
        }

        // Service filter
        if (layanan) {
            whereCondition.layanan = layanan;
        }

        try {
            // Get revenue summary by service
            const revenueSummary = await this.orderModel.findAll({
                where: whereCondition,
                attributes: [
                    'layanan',
                    [fn('COUNT', col('id')), 'jumlah_order'],
                    [fn('SUM', col('total_harga')), 'total_pendapatan'],
                    [fn('SUM', col('total_berat')), 'total_berat'],
                    [
                        literal('ROUND(SUM(total_harga) / COUNT(id), 2)'),
                        'rata_rata_pendapatan_per_order'
                    ]
                ],
                group: ['layanan'],
                raw: true
            });

            // Transform data
            const summaryByService: ServiceSummaryDto[] = revenueSummary.map((item: any) => ({
                layanan: item.layanan || 'Unknown',
                jumlah_order: parseInt(item.jumlah_order) || 0,
                total_pendapatan: parseFloat(item.total_pendapatan) || 0,
                rata_rata_pendapatan_per_order: parseFloat(item.rata_rata_pendapatan_per_order) || 0,
                total_berat: parseFloat(item.total_berat) || 0
            }));

            // Calculate grand totals
            const grandTotal: GrandTotalDto = summaryByService.reduce((acc, item) => ({
                jumlah_order: acc.jumlah_order + item.jumlah_order,
                total_pendapatan: acc.total_pendapatan + item.total_pendapatan,
                rata_rata_pendapatan_per_order: 0, // Will be calculated below
                total_berat: acc.total_berat + item.total_berat
            }), {
                jumlah_order: 0,
                total_pendapatan: 0,
                rata_rata_pendapatan_per_order: 0,
                total_berat: 0
            });

            // Calculate average revenue per order for grand total
            if (grandTotal.jumlah_order > 0) {
                grandTotal.rata_rata_pendapatan_per_order = Math.round(grandTotal.total_pendapatan / grandTotal.jumlah_order);
            }

            // Format period string
            const period = start_date && end_date
                ? `${start_date} to ${end_date}`
                : 'All time';

            return {
                message: 'Ringkasan pendapatan berdasarkan layanan berhasil diambil',
                success: true,
                data: {
                    periode: period,
                    summary_by_service: summaryByService,
                    grand_total: grandTotal
                }
            };

        } catch (error) {
            throw new InternalServerErrorException(`Gagal mengambil ringkasan pendapatan: ${error.message}`);
        }
    }

    private extractBankFromNotes(notes: string): string | null {
        if (!notes) return null;
        const bankMatch = notes.match(/Bank Pembayaran:\s*(.*)/);
        if (bankMatch && bankMatch[1]) {
            return bankMatch[1].trim();
        }
        return null;
    }

    async updateInvoiceStatus(invoiceNo: string, body: any) {
        const {
            status_action,
            updated_by_user_id
        } = body;

        try {
            // 1. Validasi user
            const user = await this.userModel.findByPk(updated_by_user_id);
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            // 2. Cari invoice berdasarkan invoice_no
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
            const currentStatus = order.getDataValue('invoiceStatus');
            const updateHistory: string[] = [];

            // 3. Mulai transaksi
            if (!this.orderModel.sequelize) throw new Error('Sequelize instance not found');
            return await this.orderModel.sequelize.transaction(async (t: any) => {
                switch (status_action) {
                    case 'generate':
                        return await this.handleGenerateInvoice(order, updated_by_user_id, t, updateHistory);

                    case 'submit':
                        return await this.handleSubmitInvoice(invoice, order, updated_by_user_id, t, updateHistory);

                    case 'revert_to_draft':
                        return await this.handleRevertToDraft(invoice, order, updated_by_user_id, t, updateHistory);

                    case 'update_unpaid':
                        return await this.handleUpdateUnpaid(invoice, order, updated_by_user_id, t, updateHistory);

                    default:
                        throw new Error('Status action tidak valid');
                }
            });

        } catch (error) {
            throw new Error(`Error updating invoice status: ${error.message}`);
        }
    }

    private async handleGenerateInvoice(order: any, updatedByUserId: number, transaction: any, updateHistory: string[]) {
        // Validasi status saat ini
        const currentStatus = order.getDataValue('invoiceStatus');
        if (currentStatus !== INVOICE_STATUS.BELUM_PROSES) {
            throw new Error('Invoice hanya bisa di-generate jika status order adalah belum proses');
        }

        // Cek apakah invoice sudah ada
        const existingInvoice = await this.orderInvoiceModel.findOne({
            where: { order_id: order.id }
        });

        if (existingInvoice) {
            throw new Error('Invoice untuk order ini sudah ada');
        }

        // Generate invoice_no, ambil dari no tracking
        const invoiceNo = order.getDataValue('no_tracking');

        // Buat invoice baru
        const invoice = await this.orderInvoiceModel.create({
            order_id: order.id,
            invoice_no: invoiceNo,
            invoice_date: new Date(),
            payment_terms: 'Net 30',
            vat: 0,
            discount: 0,
            packing: '0',
            asuransi: 0,
            ppn: 0,
            pph: 0,
            kode_unik: 0,
            konfirmasi_bayar: 0,
            notes: '',
            beneficiary_name: '',
            acc_no: '',
            bank_name: '',
            bank_address: '',
            swift_code: '',
            paid_attachment: '',
            payment_info: 0,
            fm: 0,
            lm: 0,
            bill_to_name: order.getDataValue('nama_pengirim'),
            bill_to_phone: order.getDataValue('phone_pengirim'),
            bill_to_address: order.getDataValue('alamat_pengirim'),
            create_date: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            isGrossUp: 0,
            isUnreweight: 0,
            noFaktur: ''
        }, { transaction });

        // Buat invoice details
        const totalHarga = order.getDataValue('total_harga');
        await this.orderInvoiceDetailModel.create({
            invoice_id: invoice.id,
            description: 'Biaya Pengiriman Barang',
            qty: 1,
            uom: 'pcs',
            unit_price: totalHarga,
            remark: ''
        }, { transaction });

        // Update order status
        await order.update({
            invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH,
            isUnpaid: 1,
            isPartialPaid: 0,
            sisaAmount: totalHarga.toString()
        }, { transaction });

        updateHistory.push('Invoice berhasil di-generate');
        updateHistory.push('Status order diubah menjadi belum ditagih');

        return {
            message: 'Invoice berhasil di-generate',
            success: true,
            data: {
                invoice_no: invoiceNo,
                status_action: 'generate',
                current_status: INVOICE_STATUS.BELUM_DITAGIH,
                updates: updateHistory,
                order_id: order.id
            }
        };
    }

    private async handleSubmitInvoice(invoice: any, order: any, updatedByUserId: number, transaction: any, updateHistory: string[]) {
        // Validasi status saat ini
        const currentStatus = order.getDataValue('invoiceStatus');
        if (currentStatus !== INVOICE_STATUS.BELUM_DITAGIH) {
            throw new Error('Invoice hanya bisa di-submit jika status adalah belum ditagih');
        }

        // Update invoice status
        await invoice.update({
            konfirmasi_bayar: 1
        }, { transaction });

        // Update order status
        await order.update({
            invoiceStatus: INVOICE_STATUS.SUDAH_DITAGIH
        }, { transaction });

        updateHistory.push('Invoice berhasil di-submit');
        updateHistory.push('Status invoice diubah menjadi sudah ditagih');

        return {
            message: 'Invoice berhasil di-submit',
            success: true,
            data: {
                invoice_no: invoice.getDataValue('invoice_no'),
                status_action: 'submit',
                current_status: INVOICE_STATUS.SUDAH_DITAGIH,
                updates: updateHistory
            }
        };
    }

    private async handleRevertToDraft(invoice: any, order: any, updatedByUserId: number, transaction: any, updateHistory: string[]) {
        // Validasi status saat ini
        const currentStatus = order.getDataValue('invoiceStatus');
        if (currentStatus !== INVOICE_STATUS.SUDAH_DITAGIH) {
            throw new Error('Invoice hanya bisa di-revert jika status adalah sudah ditagih');
        }

        // Update invoice status
        await invoice.update({
            konfirmasi_bayar: 0
        }, { transaction });

        // Update order status
        await order.update({
            invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH
        }, { transaction });

        updateHistory.push('Invoice berhasil di-revert ke draft');

        return {
            message: 'Invoice berhasil di-revert ke draft',
            success: true,
            data: {
                invoice_no: invoice.getDataValue('invoice_no'),
                status_action: 'revert_to_draft',
                current_status: INVOICE_STATUS.BELUM_DITAGIH,
                updates: updateHistory
            }
        };
    }

    private async handleUpdateUnpaid(invoice: any, order: any, updatedByUserId: number, transaction: any, updateHistory: string[]) {
        // Validasi status saat ini
        const currentStatus = order.getDataValue('invoiceStatus');
        if (currentStatus === INVOICE_STATUS.LUNAS) {
            throw new Error('Invoice sudah lunas, tidak bisa di-update');
        }

        const totalHarga = order.getDataValue('total_harga');

        // Update order status menjadi unpaid
        await order.update({
            invoiceStatus: INVOICE_STATUS.UNPAID,
            isUnpaid: 1,
            isPartialPaid: 0,
            sisaAmount: totalHarga.toString()
        }, { transaction });

        // Update invoice status
        await invoice.update({
            konfirmasi_bayar: 0
        }, { transaction });

        updateHistory.push('Status invoice diupdate menjadi unpaid');
        updateHistory.push(`Sisa pembayaran: ${totalHarga}`);

        return {
            message: 'Status invoice berhasil diupdate menjadi unpaid',
            success: true,
            data: {
                invoice_no: invoice.getDataValue('invoice_no'),
                status_action: 'update_unpaid',
                current_status: INVOICE_STATUS.UNPAID,
                updates: updateHistory,
                sisa_amount: totalHarga
            }
        };
    }
} 