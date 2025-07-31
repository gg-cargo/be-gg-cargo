import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal, where } from 'sequelize';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { Invoice } from '../models/invoice.model';
import { PaymentOrder } from '../models/payment-order.model';
import { FinanceSummaryDto } from './dto/finance-summary.dto';
import { FinanceShipmentsDto } from './dto/finance-shipments.dto';

@Injectable()
export class FinanceService {
    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderInvoice)
        private readonly orderInvoiceModel: typeof OrderInvoice,
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
} 