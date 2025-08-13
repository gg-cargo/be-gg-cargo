import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { TransactionPayment } from '../models/transaction-payment.model';
import { OrderHistory } from '../models/order-history.model';
import { User } from '../models/user.model';
import { PaymentOrder } from '../models/payment-order.model';
import { Saldo } from '../models/saldo.model';
import { CreateVaDto, CreateVaResponseDto, MidtransNotificationDto, GetTransactionPaymentByTrackingResponseDto, TransactionPaymentDataDto, CancelPaymentDto, CancelPaymentResponseDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderInvoice)
        private readonly orderInvoiceModel: typeof OrderInvoice,
        @InjectModel(TransactionPayment)
        private readonly transactionPaymentModel: typeof TransactionPayment,
        @InjectModel(OrderHistory)
        private readonly orderHistoryModel: typeof OrderHistory,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(PaymentOrder)
        private readonly paymentOrderModel: typeof PaymentOrder,
        @InjectModel(Saldo)
        private readonly saldoModel: typeof Saldo,
    ) { }

    async createVa(createVaDto: CreateVaDto): Promise<CreateVaResponseDto> {
        const { order_id, payment_method } = createVaDto;

        try {

            // 2. Validasi order
            const order = await this.orderModel.findByPk(order_id);
            if (!order) {
                throw new BadRequestException('Order tidak ditemukan');
            }

            // Validasi total_harga tidak boleh 0 atau negatif
            const totalHarga = Number(order.getDataValue('total_harga')) || 0;
            if (totalHarga <= 0) {
                throw new BadRequestException(`Order dengan ID ${order_id} memiliki total harga yang tidak valid (Rp ${totalHarga.toLocaleString()}). Total harga harus lebih dari 0 untuk dapat membuat Virtual Account. Silakan hubungi customer service untuk informasi lebih lanjut.`);
            }

            // 3. Cek apakah sudah ada transaksi pembayaran aktif
            const existingPayment = await this.transactionPaymentModel.findOne({
                where: { order_id }
            });

            if (existingPayment) {
                // Cek apakah transaksi sudah expired
                const paymentExpireTime = existingPayment.getDataValue('expired_at');
                const isExpired = paymentExpireTime && new Date(paymentExpireTime) < new Date();

                if (!isExpired) {
                    throw new BadRequestException('Order ini sudah memiliki transaksi pembayaran aktif yang belum expired');
                } else {
                    // Jika expired, hapus transaksi lama dan lanjutkan
                    await this.transactionPaymentModel.destroy({
                        where: { order_id }
                    });
                }
            }

            // 4. Cek invoice
            const invoice = await this.orderInvoiceModel.findOne({
                where: { order_id }
            });
            if (!invoice) {
                throw new BadRequestException('Invoice untuk order ini belum dibuat');
            }

            // 5. Mulai transaksi database
            if (!this.orderModel.sequelize) {
                throw new InternalServerErrorException('Sequelize instance not found');
            }

            return await this.orderModel.sequelize.transaction(async (t: Transaction) => {
                // Jika ada transaksi expired, update status order
                if (existingPayment) {
                    await order.update({
                        payment_status: 'expired',
                        payment_expire_time: new Date(),
                        updated_at: new Date()
                    }, { transaction: t });
                }

                // 6. Siapkan payload Midtrans Core API
                const grossAmount = Number(order.getDataValue('total_harga')) || 0;
                const orderIdMidtrans = order.getDataValue('no_tracking');
                const customer = {
                    first_name: order.getDataValue('nama_penerima') || 'Customer',
                    email: order.getDataValue('email_penerima') || 'no-reply@example.com',
                    phone: order.getDataValue('no_telepon_penerima') || ''
                };

                // Map payment_method ke bank code Midtrans
                const bankCodeMap: { [key: string]: string } = {
                    'bca_va': 'bca',
                    'mandiri_va': 'mandiri',
                    'bni_va': 'bni',
                    'bri_va': 'bri',
                    'permata_va': 'permata'
                };
                const bankCode = bankCodeMap[payment_method] || 'bca';

                // 7. Panggil Midtrans Core API
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Midtrans = require('midtrans-client');
                const snap = new Midtrans.CoreApi({
                    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
                    serverKey: process.env.MIDTRANS_SERVER_KEY,
                    clientKey: process.env.MIDTRANS_CLIENT_KEY,
                });

                const chargePayload: any = {
                    payment_type: 'bank_transfer',
                    transaction_details: {
                        order_id: orderIdMidtrans,
                        gross_amount: grossAmount,
                    },
                    customer_details: customer,
                    bank_transfer: {
                        bank: bankCode
                    },
                    custom_expiry: {
                        unit: 'day',
                        expiry_duration: 2
                    }
                };

                const chargeResponse = await snap.charge(chargePayload);

                // 8. Ekstrak data dari response Midtrans
                const vaNumbers = chargeResponse.va_numbers || [];
                const vaInfo = vaNumbers.length > 0 ? vaNumbers[0] : null;
                const vaNumber = vaInfo ? vaInfo.va_number : null;
                const vaBank = vaInfo ? vaInfo.bank : bankCode;
                const transactionId = chargeResponse.transaction_id;
                const transactionTime = chargeResponse.transaction_time;
                const expireTime = chargeResponse.expiry_time || null;
                const redirectUrl = `https://99delivery.id/payment/${order_id}`

                // 9. Simpan ke transaction_payment
                await this.transactionPaymentModel.create({
                    user_id: order.getDataValue('order_by'),
                    order_id: order.getDataValue('id'),
                    no_tracking: order.getDataValue('no_tracking'),
                    price: String(grossAmount),
                    sid: transactionId,
                    link_payment: redirectUrl,
                    bank_code: vaBank?.toUpperCase() || bankCode.toUpperCase(),
                    bank_name: vaBank?.toUpperCase() || bankCode.toUpperCase(),
                    no_va: vaNumber,
                    expired_at: expireTime,
                    created_at: new Date(),
                    updated_at: new Date(),
                }, { transaction: t });

                // 10. Update orders
                await order.update({
                    payment_uuid: transactionId,
                    payment_transaction_time: transactionTime ? new Date(transactionTime) : new Date(),
                    payment_expire_time: expireTime ? new Date(expireTime) : null,
                    payment_redirect: redirectUrl,
                    payment_status: 'pending'
                }, { transaction: t });

                // 11. Update invoice
                await invoice.update({
                    konfirmasi_bayar: 1
                }, { transaction: t });

                // 12. Tulis order_histories
                const isRegeneration = existingPayment ? true : false;
                await this.orderHistoryModel.create({
                    order_id: order.getDataValue('id'),
                    status: isRegeneration ? 'VA Regenerated' : 'VA Created',
                    provinsi: '-',
                    kota: '-',
                    date: new Date(),
                    time: new Date().toTimeString().slice(0, 8),
                    remark: `${isRegeneration ? 'VA Regenerated' : 'VA Created'}: ${vaBank?.toUpperCase()}:${vaNumber} expired at ${expireTime}`,
                    created_at: new Date()
                }, { transaction: t });

                // 13. Return response
                return {
                    message: isRegeneration ? 'Virtual Account berhasil dibuat ulang.' : 'Virtual Account berhasil dibuat.',
                    data: {
                        transaction_id: transactionId,
                        va_number: vaNumber,
                        bank_name: `${vaBank?.toUpperCase() || bankCode.toUpperCase()} Virtual Account`,
                        expiry_time: expireTime,
                        payment_link: redirectUrl
                    }
                };
            });

        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            // Log error untuk debugging
            console.error('Error creating VA:', error);

            throw new InternalServerErrorException(
                `Gagal membuat Virtual Account: ${error.message}`
            );
        }
    }

    async handleMidtransNotification(notification: MidtransNotificationDto): Promise<{ message: string }> {
        try {
            // 1. Validasi signature key untuk keamanan
            const isValidSignature = this.validateMidtransSignature(notification);
            if (!isValidSignature) {
                throw new ForbiddenException('Invalid signature key');
            }

            // 2. Cari order berdasarkan transaction_id
            const order = await this.orderModel.findOne({
                where: { payment_uuid: notification.transaction_id }
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // 3. Mulai transaksi database
            if (!this.orderModel.sequelize) {
                throw new InternalServerErrorException('Sequelize instance not found');
            }

            return await this.orderModel.sequelize.transaction(async (t: Transaction) => {
                const updateHistory: string[] = [];
                const orderId = order.getDataValue('id');
                const userId = order.getDataValue('order_by');

                // 4. Proses berdasarkan transaction_status
                switch (notification.transaction_status) {
                    case 'settlement':
                    case 'capture':
                        await this.handlePaymentSuccess(order, notification, t, updateHistory);
                        break;
                    case 'expire':
                    case 'deny':
                    case 'cancel':
                        await this.handlePaymentFailed(order, notification, t, updateHistory);
                        break;
                    default:
                        updateHistory.push(`Status pembayaran: ${notification.transaction_status}`);
                }

                // 5. Update payment_order
                await this.createPaymentOrderRecord(order, notification, t);

                // 6. Update order_histories
                await this.orderHistoryModel.create({
                    order_id: orderId,
                    status: this.getHistoryStatus(notification.transaction_status),
                    provinsi: '-',
                    kota: '-',
                    date: new Date(),
                    time: new Date().toTimeString().slice(0, 8),
                    remark: `Midtrans Notification: ${notification.transaction_status} - ${updateHistory.join(', ')}`,
                    created_by: 0, // System user
                    created_at: new Date()
                }, { transaction: t });

                return { message: 'Notification processed successfully' };
            });

        } catch (error) {
            console.error('Error processing Midtrans notification:', error);
            throw error;
        }
    }

    private validateMidtransSignature(notification: MidtransNotificationDto): boolean {
        try {
            const serverKey = process.env.MIDTRANS_SERVER_KEY;
            if (!serverKey) {
                console.error('MIDTRANS_SERVER_KEY not configured');
                return false;
            }

            // Buat signature key sesuai dokumentasi Midtrans yang benar
            // Formula: SHA512(order_id + status_code + gross_amount + server_key)
            const signatureString = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`;
            const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');

            // Log untuk debugging
            console.log('Signature validation debug:');
            console.log('Order ID:', notification.order_id);
            console.log('Status Code:', notification.status_code);
            console.log('Gross Amount:', notification.gross_amount);
            console.log('Server Key (first 10 chars):', serverKey.substring(0, 10) + '...');
            console.log('Expected Signature:', expectedSignature);
            console.log('Received Signature:', notification.signature_key);
            console.log('Signature Match:', notification.signature_key === expectedSignature);

            return notification.signature_key === expectedSignature;
        } catch (error) {
            console.error('Error validating signature:', error);
            return false;
        }
    }

    private async handlePaymentSuccess(order: any, notification: MidtransNotificationDto, transaction: Transaction, updateHistory: string[]) {
        // Update orders
        await order.update({
            payment_status: 'paid',
            isUnpaid: 0,
            isPartialPaid: 0,
            sisaAmount: '0'
        }, { transaction });

        // Update order_invoices
        const invoice = await this.orderInvoiceModel.findOne({
            where: { order_id: order.getDataValue('id') }
        });
        if (invoice) {
            await invoice.update({
                konfirmasi_bayar: 1
            }, { transaction });
        }

        // Update saldo jika ada
        const saldo = await this.saldoModel.findOne({
            where: { user_id: order.getDataValue('order_by') }
        });
        if (saldo) {
            const currentSaldo = parseFloat(saldo.getDataValue('saldo') || '0');
            const paymentAmount = parseFloat(notification.gross_amount);
            await saldo.update({
                saldo: (currentSaldo + paymentAmount).toString()
            }, { transaction });
        }

        updateHistory.push('Pembayaran berhasil diproses');
        updateHistory.push(`Amount: ${notification.gross_amount}`);
    }

    private async handlePaymentFailed(order: any, notification: MidtransNotificationDto, transaction: Transaction, updateHistory: string[]) {
        // Update orders
        await order.update({
            payment_status: 'failed',
            isUnpaid: 1,
            isPartialPaid: 0
        }, { transaction });

        // Update order_invoices
        const invoice = await this.orderInvoiceModel.findOne({
            where: { order_id: order.getDataValue('id') }
        });
        if (invoice) {
            await invoice.update({
                konfirmasi_bayar: 0
            }, { transaction });
        }

        updateHistory.push('Pembayaran gagal diproses');
        updateHistory.push(`Status: ${notification.transaction_status}`);
    }

    private async createPaymentOrderRecord(order: any, notification: MidtransNotificationDto, transaction: Transaction) {
        const paymentOrderId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await this.paymentOrderModel.create({
            id: paymentOrderId,
            order_id: order.getDataValue('id').toString(),
            no_tracking: order.getDataValue('no_tracking'),
            amount: notification.gross_amount,
            bank_name: notification.payment_type === 'bank_transfer' ? 'Virtual Account' : notification.payment_type,
            user_id: order.getDataValue('order_by').toString(),
            date: new Date(notification.transaction_time).toISOString().split('T')[0],
            created_at: new Date()
        }, { transaction });
    }

    private getHistoryStatus(transactionStatus: string): string {
        switch (transactionStatus) {
            case 'settlement':
            case 'capture':
                return 'Payment Success';
            case 'expire':
                return 'Payment Expired';
            case 'deny':
                return 'Payment Denied';
            case 'cancel':
                return 'Payment Cancelled';
            default:
                return 'Payment Status Updated';
        }
    }

    /**
     * Mendapatkan status pembayaran berdasarkan no_tracking
     * @param noTracking Nomor tracking/resi order
     * @returns Status pembayaran order
     */
    async getPaymentStatus(noTracking: string): Promise<{ message: string; data: { no_tracking: string; payment_status: string } }> {
        try {
            // Cari order berdasarkan no_tracking
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking },
                attributes: ['id', 'no_tracking', 'payment_status', 'payment_expire_time']
            });

            if (!order) {
                throw new NotFoundException(`Order dengan no_tracking ${noTracking} tidak ditemukan`);
            }

            const paymentStatus = order.getDataValue('payment_status');
            const expireTime = order.getDataValue('payment_expire_time');

            // Cek apakah status pending sudah expired
            let finalStatus = paymentStatus;
            if (paymentStatus === 'pending' && expireTime) {
                const now = new Date();
                const expireDate = new Date(expireTime);

                if (now > expireDate) {
                    finalStatus = 'expired';

                    // Update status di database jika expired
                    await order.update({
                        payment_status: 'expired',
                        updated_at: new Date()
                    });
                }
            }

            return {
                message: 'Status pembayaran berhasil diambil',
                data: {
                    no_tracking: noTracking,
                    payment_status: finalStatus || 'pending'
                }
            };

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            console.error('Error getting payment status:', error);
            throw new InternalServerErrorException('Gagal mendapatkan status pembayaran');
        }
    }

    /**
     * Mendapatkan data transaction payment berdasarkan no_tracking
     * @param noTracking Nomor tracking/resi order
     * @returns Data transaction payment
     */
    async getTransactionPaymentByTracking(noTracking: string): Promise<GetTransactionPaymentByTrackingResponseDto> {
        try {
            // Cari transaction payment berdasarkan no_tracking
            const transactionPayment = await this.transactionPaymentModel.findOne({
                where: { no_tracking: noTracking },
                include: [
                    {
                        model: Order,
                        as: 'order',
                        attributes: ['id', 'no_tracking', 'payment_status', 'total_harga']
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email', 'phone']
                    }
                ]
            });

            if (!transactionPayment) {
                throw new NotFoundException(`Transaction payment dengan no_tracking ${noTracking} tidak ditemukan`);
            }

            // Format response data
            const responseData: TransactionPaymentDataDto = {
                price: transactionPayment.getDataValue('price'),
                no_tracking: transactionPayment.getDataValue('no_tracking'),
                payment_link: transactionPayment.getDataValue('link_payment'),
                transaction_id: transactionPayment.getDataValue('sid'),
                bank_name: `${transactionPayment.getDataValue('bank_name')} Virtual Account`,
                va_number: transactionPayment.getDataValue('no_va'),
                expiry_time: transactionPayment.getDataValue('expired_at'),
            };

            return {
                message: 'Data transaction payment berhasil ditemukan',
                data: responseData
            };

        } catch (error) {
            console.error('Error getting transaction payment by tracking:', error);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Gagal mengambil data transaction payment');
        }
    }

    /**
     * Membatalkan transaksi pembayaran berdasarkan no_tracking
     * @param cancelPaymentDto Data untuk membatalkan pembayaran
     * @returns Response pembatalan pembayaran
     */
    async cancelPayment(cancelPaymentDto: CancelPaymentDto): Promise<CancelPaymentResponseDto> {
        const { no_tracking } = cancelPaymentDto;

        try {
            // 1. Validasi order berdasarkan no_tracking
            const order = await this.orderModel.findOne({
                where: { no_tracking },
                attributes: ['id', 'no_tracking', 'payment_status', 'payment_uuid']
            });

            if (!order) {
                throw new NotFoundException(`Order dengan no_tracking ${no_tracking} tidak ditemukan`);
            }

            // 2. Validasi payment_status
            const paymentStatus = order.getDataValue('payment_status');
            if (paymentStatus !== 'pending') {
                throw new BadRequestException(`Pembayaran tidak dapat dibatalkan. Status pembayaran saat ini: ${paymentStatus}. Hanya pembayaran dengan status 'pending' yang dapat dibatalkan.`);
            }

            // 3. Cek apakah ada transaksi payment yang aktif
            const transactionPayment = await this.transactionPaymentModel.findOne({
                where: { no_tracking }
            });

            if (!transactionPayment) {
                throw new BadRequestException(`Tidak ada transaksi pembayaran aktif untuk order dengan no_tracking ${no_tracking}`);
            }

            // 4. Mulai transaksi database
            if (!this.orderModel.sequelize) {
                throw new InternalServerErrorException('Sequelize instance not found');
            }

            return await this.orderModel.sequelize.transaction(async (t: Transaction) => {
                const orderId = order.getDataValue('id');
                const paymentUuid = order.getDataValue('payment_uuid');

                // 5. Panggil Midtrans Core API untuk expire transaksi
                if (paymentUuid) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const Midtrans = require('midtrans-client');
                        const snap = new Midtrans.CoreApi({
                            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
                            serverKey: process.env.MIDTRANS_SERVER_KEY,
                            clientKey: process.env.MIDTRANS_CLIENT_KEY,
                        });

                        // Expire transaksi di Midtrans
                        await snap.transaction.cancel(paymentUuid);
                        console.log(`Midtrans transaction ${paymentUuid} expired successfully`);
                    } catch (midtransError) {
                        console.error('Error expiring Midtrans transaction:', midtransError);
                        // Lanjutkan proses meskipun Midtrans gagal, karena kita tetap ingin update database
                    }
                }

                // 6. Update status order menjadi 'cancelled'
                await order.update({
                    payment_status: 'cancelled',
                    updated_at: new Date()
                }, { transaction: t });

                // 7. Hapus entry transaction_payment
                if (transactionPayment) {
                    await transactionPayment.destroy({ transaction: t });
                    console.log(`Transaction payment entry untuk ${no_tracking} berhasil dihapus`);
                }

                // 8. Tulis order_histories untuk audit trail
                await this.orderHistoryModel.create({
                    order_id: orderId,
                    status: 'Payment Cancelled',
                    provinsi: '-',
                    kota: '-',
                    date: new Date(),
                    time: new Date().toTimeString().slice(0, 8),
                    remark: 'VA payment cancelled via public endpoint',
                    created_by: 0, // System user
                    created_at: new Date()
                }, { transaction: t });

                return {
                    message: 'Pembayaran berhasil dibatalkan.'
                };
            });

        } catch (error) {
            console.error('Error cancelling payment:', error);

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                `Gagal membatalkan pembayaran: ${error.message}`
            );
        }
    }
}
