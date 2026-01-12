import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Order } from '../models/order.model';
import { OrderInvoice } from '../models/order-invoice.model';
import { User } from '../models/user.model';
import { SendEmailDto, SendEmailResponseDto, GetInvoiceByTrackingResponseDto, InvoiceByTrackingDataDto, GetInvoiceSendDataResponseDto, InvoiceSendDataDto } from './dto';
import * as FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderInvoice)
        private readonly orderInvoiceModel: typeof OrderInvoice,
        @InjectModel(User)
        private readonly userModel: typeof User,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Mengirim email invoice melalui Mailgun API
     * @param sendEmailDto Data untuk mengirim email
     * @returns Response dari pengiriman email
     */
    async sendEmail(sendEmailDto: SendEmailDto): Promise<SendEmailResponseDto> {
        try {
            const {
                invoice_no,
                to_emails,
                cc_emails,
                subject,
                body,
                send_download_link,
                sent_by_user_id
            } = sendEmailDto;

            // 1. Validasi user yang mengirim
            const sender = await this.userModel.findByPk(sent_by_user_id);
            if (!sender) {
                throw new NotFoundException('User pengirim tidak ditemukan');
            }

            // 2. Validasi invoice
            const invoice = await this.orderInvoiceModel.findOne({
                where: { invoice_no },
                include: [{
                    model: Order,
                    as: 'order',
                    attributes: ['no_tracking', 'total_harga', 'billing_name', 'billing_email', 'billing_phone', 'nama_penerima', 'email_penerima', 'no_telepon_penerima', 'id', 'layanan', 'nama_pengirim', 'alamat_pengirim', 'provinsi_pengirim', 'kota_pengirim', 'kecamatan_pengirim', 'kelurahan_pengirim', 'kodepos_pengirim', 'no_telepon_pengirim', 'nama_penerima', 'alamat_penerima', 'provinsi_penerima', 'kota_penerima', 'kecamatan_penerima', 'kelurahan_penerima', 'kodepos_penerima', 'no_telepon_penerima']
                }]
            });

            if (!invoice) {
                throw new NotFoundException(`Invoice dengan nomor ${invoice_no} tidak ditemukan`);
            }

            const order = invoice.getDataValue('order');
            if (!order) {
                throw new NotFoundException('Data order tidak ditemukan');
            }

            // 3. Siapkan konten email
            const emailContent = await this.buildEmailContent(body, order, send_download_link, invoice_no);
            const emailSubject = this.buildEmailSubject(subject, invoice_no, order.getDataValue('no_tracking'));

            // 4. Kirim email melalui Mailgun
            const mailgunResponse = await this.sendMailgunEmail({
                to: to_emails,
                cc: cc_emails,
                subject: emailSubject,
                html: emailContent,
                from: 'GG Kargo <no-reply@99delivery.id>'
            });

            // 5. Log pengiriman email (opsional)
            await this.logEmailSent(invoice_no, sent_by_user_id, to_emails, cc_emails, mailgunResponse.id);

            return {
                message: 'Email invoice berhasil dikirim',
                success: true,
                message_id: mailgunResponse.id
            };

        } catch (error) {
            console.error('Error sending email:', error);

            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }

            return {
                message: 'Gagal mengirim email invoice',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Membuat konten email dengan data dinamis
     */
    private async buildEmailContent(body: string, order: any, sendDownloadLink: boolean, invoiceNo: string): Promise<string> {
        const trackingNumber = order.getDataValue('no_tracking');
        const customerName = order.getDataValue('nama_penerima');
        const totalAmount = order.getDataValue('total_harga');
        const customerEmail = order.getDataValue('email_penerima');

        // Replace placeholder dengan data dinamis
        let emailContent = body
            .replace(/\[nama_penerima\]/g, customerName || 'Customer')
            .replace(/\[no_tracking\]/g, trackingNumber || 'N/A')
            .replace(/\[total_harga\]/g, this.formatCurrency(totalAmount || 0))
            .replace(/\[email_penerima\]/g, customerEmail || 'N/A');

        // Generate invoice PDF jika diminta
        if (sendDownloadLink) {
            try {
                // Generate invoice PDF terlebih dahulu
                const invoiceData = await this.buildInvoiceData(order, invoiceNo);
                const pdfPath = await this.generateInvoicePDF(invoiceData);

                // Gunakan path PDF yang sudah di-generate
                const downloadUrl = `${this.configService.get('APP_URL')}${pdfPath}`;
                emailContent += `
                    <br><br>
                    <p>Untuk mengunduh invoice lengkap, silakan klik link berikut:</p>
                    <p><a href="${downloadUrl}" style="background-color: #1A723B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Invoice PDF</a></p>
                `;
            } catch (error) {
                console.error('Error generating invoice PDF:', error);
                // Jika gagal generate PDF, tambahkan pesan error
                emailContent += `
                    <br><br>
                    <p style="color: #ff0000;">Maaf, invoice PDF tidak dapat di-generate saat ini. Silakan hubungi customer service untuk bantuan.</p>
                `;
            }
        }

        // Tambahkan footer
        emailContent += `
            <br><br>
            <hr>
            <p style="font-size: 12px; color: 666;">
                Email ini dikirim otomatis oleh sistem GG Kargo.<br>
                Jika ada pertanyaan, silakan hubungi customer service kami.
            </p>
        `;

        return emailContent;
    }

    /**
     * Membuat subject email dengan data dinamis
     */
    private buildEmailSubject(subject: string, invoiceNo: string, trackingNo: string): string {
        return subject
            .replace('[invoice_no]', invoiceNo)
            .replace('[no_tracking]', trackingNo || 'N/A');
    }

    /**
     * Format currency ke format Rupiah
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    }

    /**
     * Membuat data invoice untuk generate PDF
     */
    private async buildInvoiceData(order: any, invoiceNo: string): Promise<any> {
        // Ambil data order invoice
        const orderInvoice = await this.orderInvoiceModel.findOne({
            where: { order_id: order.getDataValue('id') }
        });

        if (!orderInvoice) {
            throw new Error('Order invoice tidak ditemukan');
        }

        // Build invoice data sesuai format yang dibutuhkan generateInvoicePDF
        return {
            invoice_details: {
                no_invoice: invoiceNo,
                tgl_invoice: orderInvoice.getDataValue('invoice_date') || new Date(),
                detail_pengiriman: {
                    layanan: order.getDataValue('layanan') || 'Regular',
                    pengirim: order.getDataValue('nama_pengirim') || '-',
                    alamat_pengirim: order.getDataValue('alamat_pengirim') || '-',
                    provinsi_pengirim: order.getDataValue('provinsi_pengirim') || '-',
                    kota_pengirim: order.getDataValue('kota_pengirim') || '-',
                    kecamatan_pengirim: order.getDataValue('kecamatan_pengirim') || '-',
                    kelurahan_pengirim: order.getDataValue('kelurahan_pengirim') || '-',
                    kodepos_pengirim: order.getDataValue('kodepos_pengirim') || '-',
                    no_telepon_pengirim: order.getDataValue('no_telepon_pengirim') || '-',
                    penerima: order.getDataValue('nama_penerima') || '-',
                    alamat_penerima: order.getDataValue('alamat_penerima') || '-',
                    provinsi_penerima: order.getDataValue('provinsi_penerima') || '-',
                    kota_penerima: order.getDataValue('kota_penerima') || '-',
                    kecamatan_penerima: order.getDataValue('kecamatan_penerima') || '-',
                    kelurahan_penerima: order.getDataValue('kelurahan_penerima') || '-',
                    kodepos_penerima: order.getDataValue('kodepos_penerima') || '-',
                    no_telepon_penerima: order.getDataValue('no_telepon_penerima') || '-',
                },
                item_tagihan: [
                    {
                        deskripsi: `Pengiriman ${order.getDataValue('layanan') || 'Regular'}`,
                        qty: 1,
                        uom: 'pcs',
                        harga_satuan: Number(order.getDataValue('total_harga')) || 0,
                        total: Number(order.getDataValue('total_harga')) || 0
                    }
                ],
                subtotal_layanan: Number(order.getDataValue('total_harga')) || 0,
                pph: 0, // Sesuaikan dengan perhitungan PPH yang sebenarnya
                ppn: 0, // Sesuaikan dengan perhitungan PPN yang sebenarnya
                total_akhir_tagihan: Number(order.getDataValue('total_harga')) || 0,
                info_rekening_bank: {
                    nama_bank: 'Bank Central Asia (BCA)',
                    nama_pemilik_rek: 'PT. GG KARGO',
                    no_rekening: '1234567890',
                    swift_code: 'CENAIDJA'
                },
                notes: 'Terima kasih telah menggunakan layanan GG KARGO'
            }
        };
    }

    /**
     * Generate invoice PDF menggunakan helper
     */
    private async generateInvoicePDF(invoiceData: any): Promise<string> {
        try {
            // Import helper function
            const { generateInvoicePDF } = await import('../finance/helpers/generate-invoice-pdf.helper');
            return await generateInvoicePDF(invoiceData);
        } catch (error) {
            console.error('Error importing generateInvoicePDF helper:', error);
            throw new Error('Gagal generate invoice PDF');
        }
    }

    /**
     * Mengirim email melalui Mailgun API
     */
    private async sendMailgunEmail(emailData: {
        to: string[];
        cc?: string[];
        subject: string;
        html: string;
        from?: string;
    }): Promise<{ id: string }> {
        const domain = this.configService.get('MAILGUN_DOMAIN');
        const apiKey = this.configService.get('MAILGUN_API_KEY');

        if (!domain || !apiKey) {
            throw new InternalServerErrorException('Konfigurasi Mailgun tidak lengkap');
        }

        const formData = new FormData();
        formData.append('from', emailData.from || 'GG KARGO <no-reply@99delivery.id>');
        formData.append('to', emailData.to.join(','));
        formData.append('h:Content-Type', 'text/html; charset=UTF-8');

        if (emailData.cc && emailData.cc.length > 0) {
            formData.append('cc', emailData.cc.join(','));
        }

        formData.append('subject', emailData.subject);
        formData.append('html', emailData.html);

        try {
            const response = await axios.post(
                `https://api.mailgun.net/v3/${domain}/messages`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
                    }
                }
            );

            if (response.status === 200) {
                return { id: response.data.id };
            } else {
                throw new Error(`Mailgun API error: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error('Mailgun API error:', error);
            throw new InternalServerErrorException('Gagal mengirim email melalui Mailgun');
        }
    }

    /**
 * Log pengiriman email (opsional)
 */
    private async logEmailSent(
        invoiceNo: string,
        sentByUserId: number,
        toEmails: string[],
        ccEmails?: string[],
        messageId?: string
    ): Promise<void> {
        try {
            // Implementasi logging ke database atau file log
            console.log(`Email sent for invoice ${invoiceNo}:`, {
                sent_by: sentByUserId,
                to: toEmails,
                cc: ccEmails,
                message_id: messageId,
                sent_at: new Date().toISOString()
            });
        } catch (error) {
            // Log error tidak boleh mengganggu flow utama
            console.error('Error logging email sent:', error);
        }
    }

    /**
     * Mendapatkan data invoice berdasarkan no_tracking
     * @param noTracking Nomor tracking order
     * @returns Data invoice dengan layanan dan total harga
     */
    async getInvoiceByTracking(noTracking: string): Promise<GetInvoiceByTrackingResponseDto> {
        try {
            // Cari order berdasarkan no_tracking
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking },
                attributes: ['id', 'no_tracking', 'layanan', 'total_harga'],
            });

            if (!order) {
                throw new NotFoundException(`Order dengan nomor tracking ${noTracking} tidak ditemukan`);
            }

            // Validasi total_harga tidak boleh 0
            const totalHarga = order.getDataValue('total_harga');
            if (!totalHarga || totalHarga <= 0) {
                throw new BadRequestException(`Order dengan nomor tracking ${noTracking} memiliki total harga yang tidak valid (Rp ${totalHarga || 0}). Silakan hubungi customer service untuk informasi lebih lanjut.`);
            }

            const responseData: InvoiceByTrackingDataDto = {
                no_tracking: order.getDataValue('no_tracking'),
                layanan: order.getDataValue('layanan'),
                total_harga: totalHarga,
            };

            return {
                message: 'Data invoice berhasil ditemukan',
                data: responseData
            };

        } catch (error) {
            console.error('Error getting invoice by tracking:', error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Gagal mengambil data invoice');
        }
    }

    async getInvoiceSendData(invoiceNo: string): Promise<GetInvoiceSendDataResponseDto> {
        try {
            // 1. Cari invoice berdasarkan invoice_no
            const invoice = await this.orderModel.sequelize?.models.OrderInvoice.findOne({
                where: { invoice_no: invoiceNo },
                include: [
                    {
                        model: this.orderModel,
                        as: 'order',
                        attributes: [
                            'id',
                            'no_tracking',
                            'billing_name',
                            'billing_email',
                            'billing_phone',
                            'nama_penerima',
                            'email_penerima',
                            'no_telepon_penerima',
                            'total_harga'
                        ]
                    }
                ]
            });

            if (!invoice) {
                throw new NotFoundException(`Invoice dengan nomor ${invoiceNo} tidak ditemukan`);
            }

            const order = invoice.getDataValue('order');
            if (!order) {
                throw new NotFoundException(`Order tidak ditemukan untuk invoice ${invoiceNo}`);
            }

            // 2. Ambil data yang diperlukan
            const noTracking = order.getDataValue('no_tracking');
            const billingName = order.getDataValue('billing_name') || order.getDataValue('nama_penerima');
            const billingEmail = order.getDataValue('billing_email') || order.getDataValue('email_penerima');
            const billingNomer = order.getDataValue('billing_phone') || order.getDataValue('no_telepon_penerima');
            const harga = order.getDataValue('total_harga') || 0;

            // 3. Buat subject email
            const emailSubject = `Invoice ${noTracking}`;

            // 4. Buat body email (HTML format)
            const bodyEmail = `<p>Yth Customer 99Delivery Mr/Mrs. ${billingName}</p>
<p>Kami infokan tagihan(invoice) Anda sudah terbit, Berikut adalah tagihan Anda dengan nomor tracking ${noTracking} sebesar<b>Rp${harga.toLocaleString('id-ID')}.</b></p>
<p>Harap segera lakukan proses pembayaran atau konfirmasi harga pada kami.</p>
<p><b>Pembayaran dapat dilakukan melalui:<br/>Virtual Account yang terdapat pada Aplikasi 99Delivery</b></p>
<p>Terima kasih atas kerja samanya.</p>`;

            // 5. Buat body WhatsApp (plain text format)
            const bodyWa = `Yth. Mr/Mrs. ${billingName}, 

Tagihan Anda sudah terbit dengan nomor invoice ${invoiceNo}, harap segera lakukan proses pembayaran.

Total Tagihan Invoice : *Rp${harga.toLocaleString('id-ID')}*

Mohon dapat dilakukan pembayaran melalui:
Virtual Account yang terdapat pada aplikasi 99Delivery

Terima kasih atas kerja samanya.
99Delivery`;

            // 6. Buat response
            const invoiceData: InvoiceSendDataDto = {
                invoice_no: invoiceNo,
                no_tracking: noTracking,
                billing_name: billingName,
                billing_email: billingEmail,
                billing_nomer: billingNomer,
                harga: harga,
                email_subject: emailSubject,
                body_email: bodyEmail,
                body_wa: bodyWa
            };

            return {
                status: 'success',
                invoice_data: invoiceData
            };

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting invoice send data: ${error.message}`);
        }
    }
}
