import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderList } from '../models/order-list.model';
import { OrderReferensi } from '../models/order-referensi.model';
import { RequestCancel } from '../models/request-cancel.model';
import { User } from '../models/user.model';
import { CreateOrderDto, CreateOrderPieceDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderResponseDto } from './dto/order-response.dto';
import { TrackingHelper } from './helpers/tracking.helper';
import { generateResiPDF } from './helpers/generate-resi-pdf.helper';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { ReweightPieceDto } from './dto/reweight-piece.dto';
import { ReweightPieceResponseDto } from './dto/reweight-response.dto';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { BypassReweightDto } from './dto/bypass-reweight.dto';
import { BypassReweightResponseDto } from './dto/bypass-reweight-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { ORDER_STATUS, getOrderStatusFromPieces } from '../common/constants/order-status.constants';
import { INVOICE_STATUS } from '../common/constants/invoice-status.constants';
import { Op, fn, col, literal } from 'sequelize';
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';
import { OrderInvoice } from '../models/order-invoice.model';
import { OrderInvoiceDetail } from '../models/order-invoice-detail.model';
import { Bank } from '../models/bank.model';
import { Level } from '../models/level.model';
import { FileLog } from '../models/file-log.model';
import { FileService } from '../file/file.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderShipment)
        private readonly orderShipmentModel: typeof OrderShipment,
        @InjectModel(OrderPiece)
        private readonly orderPieceModel: typeof OrderPiece,
        @InjectModel(OrderHistory)
        private readonly orderHistoryModel: typeof OrderHistory,
        @InjectModel(OrderList)
        private readonly orderListModel: typeof OrderList,
        @InjectModel(OrderReferensi)
        private readonly orderReferensiModel: typeof OrderReferensi,
        @InjectModel(RequestCancel)
        private readonly requestCancelModel: typeof RequestCancel,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(OrderInvoice)
        private readonly orderInvoiceModel: typeof OrderInvoice,
        @InjectModel(OrderInvoiceDetail)
        private readonly orderInvoiceDetailModel: typeof OrderInvoiceDetail,
        @InjectModel(Bank)
        private readonly bankModel: typeof Bank,
        @InjectModel(Level)
        private readonly levelModel: typeof Level,
        @InjectModel(FileLog)
        private readonly fileLogModel: typeof FileLog,
        private readonly fileService: FileService,
    ) { }

    /**
     * Helper function untuk menyimpan foto bukti bypass reweight
     */
    private async saveProofImage(
        proofImage: File,
        orderId: number,
        userId: number,
        transaction: Transaction
    ): Promise<FileLog> {
        try {
            // Upload file menggunakan FileService
            const uploadResult = await this.fileService.createFileLog(
                proofImage,
                userId,
                'bypass_reweight_proof'
            );

            // Assign file (set is_assigned = 1)
            await this.fileService.assignFile(uploadResult.data.id);

            // Ambil file log yang sudah dibuat
            const fileLog = await this.fileLogModel.findByPk(uploadResult.data.id);
            if (!fileLog) {
                throw new Error('File log tidak ditemukan setelah upload');
            }

            return fileLog;
        } catch (error) {
            console.error('Error saving proof image:', error);
            throw error;
        }
        // Note: FileService tidak menggunakan transaction, jadi kita tidak bisa rollback file upload
        // Jika ada error setelah file upload, file akan tetap tersimpan di storage
    }

    /**
     * Helper function untuk auto-create invoice ketika bypass reweight diaktifkan
     */
    private async autoCreateInvoice(orderId: number, transaction: Transaction): Promise<any> {
        try {
            // Ambil data order
            const order = await this.orderModel.findByPk(orderId, {
                transaction,
                include: [
                    { model: this.orderPieceModel, as: 'pieces' },
                    { model: this.orderInvoiceModel, as: 'orderInvoice' }
                ]
            });

            if (!order) {
                throw new Error('Order tidak ditemukan');
            }

            // Validasi apakah sudah ada invoice
            if (order.getDataValue('orderInvoice') && order.getDataValue('orderInvoice').getDataValue('invoice_no')) {
                return null; // Sudah ada invoice
            }

            // Ambil info bank default
            const bank = await this.bankModel.findOne({ transaction });
            if (!bank) {
                throw new Error('Info bank perusahaan belum diatur');
            }

            // Generate invoice number berdasarkan no_tracking
            const noTracking = order.getDataValue('no_tracking');
            let invoice_no = noTracking;

            // Cek apakah sudah ada invoice dengan no_tracking yang sama
            const existingInvoice = await this.orderInvoiceModel.findOne({
                where: {
                    [Op.or]: [
                        { invoice_no: noTracking },
                        { invoice_no: { [Op.like]: `${noTracking}-%` } }
                    ]
                },
                order: [['invoice_no', 'DESC']],
                transaction
            });

            if (existingInvoice && existingInvoice.invoice_no !== noTracking) {
                // Jika ada invoice dengan format no_tracking-xxx, gunakan format berikutnya
                const match = existingInvoice.invoice_no.match(new RegExp(`${noTracking}-(\\d+)`));
                if (match) {
                    const nextNumber = parseInt(match[1], 10) + 1;
                    invoice_no = `${noTracking}-${String(nextNumber).padStart(3, '0')}`;
                } else {
                    invoice_no = `${noTracking}-001`;
                }
            }

            const now = new Date();
            const invoice_date = now.toISOString().split('T')[0];

            // Komponen biaya
            const items: {
                description: string;
                qty: number;
                uom: string;
                unit_price: number;
                remark: string;
            }[] = [];

            // Hitung chargeable weight berdasarkan order shipments
            let totalWeight = 0;
            let totalVolume = 0;
            let totalBeratVolume = 0;

            // Ambil semua shipments untuk order ini
            const orderShipments = await this.orderShipmentModel.findAll({
                where: { order_id: orderId },
                attributes: ['qty', 'berat', 'panjang', 'lebar', 'tinggi'],
                transaction
            });

            // Hitung total weight dan volume dari shipments
            orderShipments.forEach((shipment) => {
                const qty = Number(shipment.getDataValue('qty')) || 0;
                const berat = Number(shipment.getDataValue('berat')) || 0;
                const panjang = Number(shipment.getDataValue('panjang')) || 0;
                const lebar = Number(shipment.getDataValue('lebar')) || 0;
                const tinggi = Number(shipment.getDataValue('tinggi')) || 0;

                // Hitung per item
                const itemWeight = berat * qty;
                let itemVolume = 0;
                let itemBeratVolume = 0;

                if (panjang && lebar && tinggi) {
                    itemVolume = this.calculateVolume(panjang, lebar, tinggi) * qty;
                    itemBeratVolume = this.calculateBeratVolume(panjang, lebar, tinggi) * qty;
                }

                // Akumulasi total
                totalWeight += itemWeight;
                totalVolume += itemVolume;
                totalBeratVolume += itemBeratVolume;
            });

            // Chargeable weight = max(total berat aktual, total berat volume)
            const chargeableWeight = Math.max(totalWeight, totalBeratVolume);

            // Biaya Pengiriman
            items.push({
                description: 'Biaya Pengiriman Barang',
                qty: chargeableWeight,
                uom: 'kg',
                unit_price: order.total_harga || 0,
                remark: `Berat terberat: ${chargeableWeight.toFixed(2)} kg (Aktual: ${totalWeight.toFixed(2)} kg, Volume: ${totalBeratVolume.toFixed(2)} kg)`
            });

            // Biaya Asuransi
            if (order.asuransi === 1) {
                items.push({
                    description: 'Biaya Asuransi',
                    qty: 1,
                    uom: 'pcs',
                    unit_price: Math.round((order.harga_barang || 0) * 0.002),
                    remark: ''
                });
            }

            // Biaya Packing
            if (order.packing === 1) {
                items.push({
                    description: 'Biaya Packing',
                    qty: 1,
                    uom: 'pcs',
                    unit_price: 5000,
                    remark: ''
                });
            }

            // Diskon (jika ada)
            if (order.voucher) {
                items.push({
                    description: 'Diskon',
                    qty: 1,
                    uom: 'voucher',
                    unit_price: -10000,
                    remark: order.voucher
                });
            }

            // Hitung total
            const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
            const ppn = Math.round(subtotal * 0.1); // 10% PPN
            const pph = 0;
            const kode_unik = Math.floor(100 + Math.random() * 900);

            // Insert ke order_invoices
            const invoice = await this.orderInvoiceModel.create({
                order_id: orderId,
                invoice_no,
                invoice_date,
                payment_terms: 'Net 30',
                vat: ppn,
                discount: 0,
                packing: order.packing,
                asuransi: order.asuransi,
                ppn,
                pph,
                kode_unik,
                notes: 'Invoice otomatis dibuat dari bypass reweight',
                beneficiary_name: bank.account_name,
                acc_no: bank.no_account,
                bank_name: bank.bank_name,
                bank_address: '',
                swift_code: '',
                payment_info: 0,
                fm: 0,
                lm: 0,
                bill_to_name: order.getDataValue('billing_name') || order.getDataValue('nama_pengirim'),
                bill_to_phone: order.getDataValue('billing_phone') || order.getDataValue('no_telepon_pengirim'),
                bill_to_address: order.getDataValue('billing_address') || order.getDataValue('alamat_pengirim'),
                create_date: now,
                noFaktur: '',
            }, { transaction });

            // Insert ke order_invoice_details
            for (const item of items) {
                await this.orderInvoiceDetailModel.create({
                    invoice_id: invoice.id,
                    description: item.description || '',
                    qty: item.qty || 0,
                    uom: item.uom || '',
                    unit_price: item.unit_price || 0,
                    remark: item.remark || ''
                }, { transaction });
            }

            return {
                invoice_no: invoice.invoice_no,
                invoice_id: invoice.id,
                total_amount: subtotal + ppn - pph
            };

        } catch (error) {
            console.error('Error auto-create invoice:', error);
            throw error;
        }
    }

    async bypassReweight(orderId: number, bypassDto: BypassReweightDto): Promise<BypassReweightResponseDto> {
        const {
            bypass_reweight_status,
            reason,
            updated_by_user_id,
            proof_image,
        } = bypassDto;

        // Validasi order exists
        const order = await this.orderModel.findByPk(orderId, {
            include: [
                {
                    model: this.orderPieceModel,
                    as: 'pieces',
                    attributes: ['id', 'reweight_status'],
                },
            ],
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Validasi user authorization (hanya Admin/Super Admin)
        // Note: Implementasi validasi level user bisa ditambahkan sesuai kebutuhan
        // const user = await this.userModel.findByPk(updated_by_user_id, {
        //     include: [{ model: this.levelModel, as: 'levelData' }]
        // });
        // if (!user || !['Admin', 'Super Admin'].includes(user.levelData?.nama)) {
        //     throw new BadRequestException('Anda tidak memiliki izin untuk melakukan bypass reweight');
        // }

        // Validasi foto bukti wajib jika bypass diaktifkan
        if (bypass_reweight_status === 'true' && !proof_image) {
            throw new BadRequestException('Foto bukti wajib diupload saat mengaktifkan bypass reweight');
        }

        // Validasi format file jika ada
        if (proof_image) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(proof_image.mimetype)) {
                throw new BadRequestException('Format file tidak didukung. Gunakan JPG, PNG, atau GIF');
            }

            // Validasi ukuran file (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (proof_image.size > maxSize) {
                throw new BadRequestException('Ukuran file terlalu besar. Maksimal 5MB');
            }
        }

        // Validasi status order untuk bypass
        const currentBypassStatus = order.getDataValue('bypass_reweight');
        const currentReweightStatus = order.getDataValue('reweight_status');

        // Jika order sudah di-reweight dan bypass diaktifkan, berikan warning
        if (currentReweightStatus === 1 && bypass_reweight_status === 'true') {
            console.warn(`Order ${orderId} sudah di-reweight, bypass reweight diaktifkan`);
        }

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const now = new Date();
            const isBypassEnabled = bypass_reweight_status === 'true';

            // 1. Update order bypass status
            await this.orderModel.update(
                {
                    bypass_reweight: bypass_reweight_status,
                    remark_reweight: reason || (isBypassEnabled ? 'Bypass reweight diaktifkan' : 'Bypass reweight dinonaktifkan'),
                    updated_at: now,
                },
                {
                    where: { id: orderId },
                    transaction,
                }
            );

            let orderPiecesUpdated = 0;

            // 2. Update order_pieces jika bypass diaktifkan
            if (isBypassEnabled) {
                // Set semua pieces menjadi reweighted
                const updateResult = await this.orderPieceModel.update(
                    {
                        reweight_status: 1,
                        reweight_by: updated_by_user_id,
                        updatedAt: now,
                    },
                    {
                        where: {
                            order_id: orderId,
                            reweight_status: 0 // Hanya update yang belum di-reweight
                        },
                        transaction,
                    }
                );
                orderPiecesUpdated = updateResult[0];

                // Update order reweight status
                await this.orderModel.update(
                    {
                        reweight_status: 1,
                        isUnreweight: 0,
                        invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH, // Update invoiceStatus menjadi "belum ditagih"
                    },
                    {
                        where: { id: orderId },
                        transaction,
                    }
                );
            } else {
                // Jika bypass dinonaktifkan, reset reweight status pieces yang belum di-reweight manual
                const updateResult = await this.orderPieceModel.update(
                    {
                        reweight_status: 0,
                        reweight_by: null,
                        updatedAt: now,
                    },
                    {
                        where: {
                            order_id: orderId,
                            reweight_by: updated_by_user_id // Reset hanya yang di-bypass
                        },
                        transaction,
                    }
                );
                orderPiecesUpdated = updateResult[0];

                // Check if any pieces still need reweight
                const remainingPieces = await this.orderPieceModel.count({
                    where: {
                        order_id: orderId,
                        reweight_status: 0
                    },
                    transaction,
                });

                if (remainingPieces > 0) {
                    // Reset order reweight status jika masih ada pieces yang belum di-reweight
                    await this.orderModel.update(
                        {
                            reweight_status: 0,
                            isUnreweight: 1,
                        },
                        {
                            where: { id: orderId },
                            transaction,
                        }
                    );
                }
            }

            // 3. Simpan foto bukti jika bypass diaktifkan
            let proofImageData: FileLog | null = null;
            if (isBypassEnabled && proof_image) {
                try {
                    proofImageData = await this.saveProofImage(proof_image, orderId, updated_by_user_id, transaction);
                } catch (proofError) {
                    console.error(`Gagal menyimpan foto bukti untuk order ${orderId}:`, proofError.message);
                    throw new Error('Gagal menyimpan foto bukti. Proses bypass reweight dibatalkan.');
                }
            }

            // 4. Auto-create invoice jika bypass diaktifkan dan status berubah menjadi BELUM_DITAGIH
            let invoiceData: {
                invoice_no: string;
                invoice_id: number;
                total_amount: number;
            } | null = null;
            if (isBypassEnabled) {
                try {
                    invoiceData = await this.autoCreateInvoice(orderId, transaction);
                } catch (invoiceError) {
                    console.warn(`Gagal auto-create invoice untuk order ${orderId}:`, invoiceError.message);
                    // Lanjutkan proses meskipun invoice gagal dibuat
                }
            }

            // 5. Create order_histories
            const statusText = isBypassEnabled ? 'Reweight Bypass Enabled' : 'Reweight Bypass Disabled';
            const historyRemark = `${statusText} oleh User ID ${updated_by_user_id}${reason ? ` dengan alasan: ${reason}` : ''}${proofImageData ? ` - Foto bukti: ${proofImageData.file_name}` : ''}${invoiceData ? ` - Invoice otomatis dibuat: ${invoiceData.invoice_no}` : ''}`;

            await this.orderHistoryModel.create(
                {
                    order_id: orderId,
                    status: statusText,
                    remark: historyRemark,
                    provinsi: order.getDataValue('provinsi_pengirim') || '',
                    kota: order.getDataValue('kota_pengirim') || '',
                    date: now.toISOString().split('T')[0],
                    time: now.toTimeString().split(' ')[0],
                    created_by: updated_by_user_id,
                },
                { transaction }
            );

            await transaction.commit();

            return {
                message: `Bypass reweight berhasil ${isBypassEnabled ? 'diaktifkan' : 'dinonaktifkan'}`,
                success: true,
                data: {
                    order_id: orderId,
                    no_tracking: order.getDataValue('no_tracking'),
                    bypass_reweight_status,
                    reason,
                    updated_by_user: `User ID ${updated_by_user_id}`,
                    updated_at: now,
                    order_pieces_updated: orderPiecesUpdated,
                    proof_image: proofImageData ? {
                        file_name: proofImageData.file_name,
                        file_path: proofImageData.file_path,
                        file_id: proofImageData.id
                    } : null,
                    invoice_created: invoiceData ? {
                        invoice_no: invoiceData.invoice_no,
                        invoice_id: invoiceData.invoice_id,
                        total_amount: invoiceData.total_amount
                    } : null,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    async createOrder(createOrderDto: CreateOrderDto, userId: number): Promise<CreateOrderResponseDto> {
        // Validasi tambahan
        this.validateOrderData(createOrderDto);

        // Generate no_tracking
        const noTracking = TrackingHelper.generateNoTracking();

        // Hitung total koli, berat, volume, dan berat volume
        const shipmentData = this.calculateShipmentData(createOrderDto.pieces);

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            // 1. Simpan ke tabel orders
            const order = await this.orderModel.create({
                no_tracking: noTracking,
                //pengirim
                nama_pengirim: createOrderDto.nama_pengirim,
                alamat_pengirim: createOrderDto.alamat_pengirim,
                provinsi_pengirim: createOrderDto.provinsi_pengirim,
                kota_pengirim: createOrderDto.kota_pengirim,
                kecamatan_pengirim: createOrderDto.kecamatan_pengirim,
                kelurahan_pengirim: createOrderDto.kelurahan_pengirim,
                kodepos_pengirim: createOrderDto.kodepos_pengirim,
                no_telepon_pengirim: createOrderDto.no_telepon_pengirim,
                email_pengirim: createOrderDto.email_pengirim,

                //penerima
                nama_penerima: createOrderDto.nama_penerima,
                alamat_penerima: createOrderDto.alamat_penerima,
                provinsi_penerima: createOrderDto.provinsi_penerima,
                kota_penerima: createOrderDto.kota_penerima,
                kecamatan_penerima: createOrderDto.kecamatan_penerima,
                kelurahan_penerima: createOrderDto.kelurahan_penerima,
                kodepos_penerima: createOrderDto.kodepos_penerima,
                no_telepon_penerima: createOrderDto.no_telepon_penerima,
                email_penerima: createOrderDto.email_penerima,

                //barang
                nama_barang: createOrderDto.nama_barang,
                layanan: createOrderDto.layanan,
                no_referensi: createOrderDto.no_referensi,
                asuransi: createOrderDto.asuransi || 0,
                packing: createOrderDto.packing || 0,
                harga_barang: createOrderDto.harga_barang || 0,

                //billing
                billing_name: createOrderDto.billing_name,
                billing_phone: createOrderDto.billing_phone,
                billing_address: createOrderDto.billing_address,
                billing_email: createOrderDto.billing_email,

                //surat jalan
                isSuratJalanBalik: createOrderDto.isSuratJalanBalik || "0",
                SJName: createOrderDto.SJName,
                SJPhone: createOrderDto.SJPhone,
                SJAddress: createOrderDto.SJAddress,
                SJLocation: createOrderDto.SJLocation,
                SJLatlng: createOrderDto.SJLatlng,
                surat_jalan_balik: createOrderDto.surat_jalan_balik,

                //pickup_time
                pickup_time: createOrderDto.pickup_time || null,

                status: ORDER_STATUS.DRAFT,
                created_by: userId,
                order_by: userId,
            }, { transaction });

            // 2. Simpan ke tabel order_shipments dan order_pieces secara batch
            let shipmentGlobalCounter = 1;
            let pieceGlobalCounter = 1;
            const shipmentsToCreate: Partial<OrderShipment>[] = [];
            const piecesToCreate: Partial<OrderPiece>[] = [];

            for (const piece of createOrderDto.pieces) {
                // Siapkan data shipment
                const shipmentData = {
                    order_id: order.id,
                    qty: piece.qty,
                    berat: piece.berat,
                    panjang: piece.panjang,
                    lebar: piece.lebar,
                    tinggi: piece.tinggi,
                    created_by: userId,
                };
                shipmentsToCreate.push(shipmentData);
            }

            // Bulk insert shipments
            const createdShipments = await this.orderShipmentModel.bulkCreate(shipmentsToCreate, { transaction, returning: true });

            // Siapkan data pieces
            for (let s = 0; s < createdShipments.length; s++) {
                const shipment = createdShipments[s];
                const piece = createOrderDto.pieces[s];
                for (let i = 0; i < piece.qty; i++) {
                    const pieceId = `P${order.id}-${pieceGlobalCounter++}`;
                    piecesToCreate.push({
                        order_id: order.id,
                        order_shipment_id: shipment.id,
                        piece_id: pieceId,
                        berat: piece.berat,
                        panjang: piece.panjang,
                        lebar: piece.lebar,
                        tinggi: piece.tinggi,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                }
            }

            // Bulk insert pieces
            await this.orderPieceModel.bulkCreate(piecesToCreate, { transaction });

            // 4. Simpan ke tabel order_histories
            await this.orderHistoryModel.create({
                order_id: order.id,
                status: ORDER_STATUS.DRAFT,
                keterangan: 'Order berhasil dibuat',
                provinsi: createOrderDto.provinsi_pengirim,
                kota: createOrderDto.kota_pengirim,
                remark: 'Order berhasil dibuat',
                created_by: userId,
            }, { transaction });

            // 5. Simpan ke tabel order_list
            // @ts-ignore
            await this.orderListModel.create({
                //pengirim
                no_tracking: noTracking,
                nama_pengirim: createOrderDto.nama_pengirim,
                alamat_pengirim: createOrderDto.alamat_pengirim,
                provinsi_pengirim: createOrderDto.provinsi_pengirim,
                kota_pengirim: createOrderDto.kota_pengirim,
                kecamatan_pengirim: createOrderDto.kecamatan_pengirim,
                kelurahan_pengirim: createOrderDto.kelurahan_pengirim,
                kodepos_pengirim: createOrderDto.kodepos_pengirim,
                no_telepon_pengirim: createOrderDto.no_telepon_pengirim,
                email_pengirim: createOrderDto.email_pengirim,

                //penerima
                nama_penerima: createOrderDto.nama_penerima,
                alamat_penerima: createOrderDto.alamat_penerima,
                provinsi_penerima: createOrderDto.provinsi_penerima,
                kota_penerima: createOrderDto.kota_penerima,
                kecamatan_penerima: createOrderDto.kecamatan_penerima,
                kelurahan_penerima: createOrderDto.kelurahan_penerima,
                kodepos_penerima: createOrderDto.kodepos_penerima,
                no_telepon_penerima: createOrderDto.no_telepon_penerima,
                email_penerima: createOrderDto.email_penerima || '',

                //pickup
                status_pickup: 'Pending',
                nama_barang: createOrderDto.nama_barang || '',
                harga_barang: createOrderDto.harga_barang || 0,
                asuransi: createOrderDto.asuransi || 0,
                pickup_time: createOrderDto.pickup_time || new Date(),
                total_berat: shipmentData.totalBerat?.toString() || '0',
                total_harga: 0, // Akan dihitung nanti
                status: 'Menunggu diproses',
                payment_status: 'pending',
                pickup_id: 0,
                is_gagal_pickup: 0,
                order_by: userId,
                svc_source_id: 0,
                hub_source_id: 0,
                svc_dest_id: 0,
                hub_dest_id: 0,
                jumlah_koli: shipmentData.totalKoli || 0,
                total_price: 0,
            }, { transaction });

            // Commit transaction
            await transaction.commit();

            return {
                order_id: order.id,
                no_tracking: noTracking,
                status: 'Order diproses',
                message: 'Order berhasil dibuat',
            };

        } catch (error) {
            // Rollback transaction jika terjadi error
            await transaction.rollback();
            throw new BadRequestException('Gagal membuat order: ' + error.message);
        }
    }

    async createResiReferensi(orderId: number) {
        // 1. Ambil data order
        const order = await this.orderModel.findByPk(orderId, { raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // 2. Ambil data shipments dan pieces
        const shipments = await this.orderShipmentModel.findAll({ where: { order_id: orderId }, raw: true });
        const pieces = await this.orderPieceModel.findAll({ where: { order_id: orderId }, raw: true });

        // 3. Generate no_tracking jika belum ada
        let noTracking = order.no_tracking;
        if (!noTracking) {
            noTracking = 'GGK' + Math.floor(Math.random() * 1e10).toString().padStart(10, '0');
            order.no_tracking = noTracking;
            await order.save();
        }

        // 4. Hitung ringkasan koli menggunakan logika yang sama dengan frontend
        let totalWeight = 0;
        let totalQty = 0;
        let totalVolume = 0;

        for (const s of shipments) {
            const qty = Number(s.qty) || 0;
            const berat = Number(s.berat) || 0;
            const panjang = Number(s.panjang) || 0;
            const lebar = Number(s.lebar) || 0;
            const tinggi = Number(s.tinggi) || 0;

            totalQty += qty;
            totalWeight += berat * qty;
            const volume = (panjang * lebar * tinggi * qty) / 1000000;
            totalVolume += volume;
        }

        const volumeWeight = totalVolume * 250;
        const kubikasi = totalVolume.toFixed(2);
        const beratVolume = volumeWeight.toFixed(2);

        // 5. Siapkan data untuk PDF
        const dataPDF = {
            no_tracking: noTracking,
            created_at: order.created_at,
            pengirim: {
                nama: order.nama_pengirim,
                alamat: order.alamat_pengirim,
                provinsi: order.provinsi_pengirim,
                kota: order.kota_pengirim,
                kecamatan: order.kecamatan_pengirim,
                kelurahan: order.kelurahan_pengirim,
                kodepos: order.kodepos_pengirim,
                telepon: order.no_telepon_pengirim,
            },
            penerima: {
                nama: order.nama_penerima,
                alamat: order.alamat_penerima,
                provinsi: order.provinsi_penerima,
                kota: order.kota_penerima,
                kecamatan: order.kecamatan_penerima,
                kelurahan: order.kelurahan_penerima,
                kodepos: order.kodepos_penerima,
                telepon: order.no_telepon_penerima,
            },
            barang: {
                nama_barang: order.nama_barang,
                harga_barang: order.harga_barang ? `IDR ${order.harga_barang.toLocaleString('id-ID')}` : '-',
                asuransi: order.asuransi ? 'Ya' : 'Tidak',
                packing: order.packing ? 'Ya' : 'Tidak',
                surat_jalan_balik: order.surat_jalan_balik || 'Tidak',
                catatan: order.remark_sales || '-',
                jumlah_koli: totalQty,
                berat_aktual: totalWeight,
                berat_volume: beratVolume,
                kubikasi: kubikasi,
            },
            ringkasan: {
                qty: totalQty,
                berat: totalWeight,
                volume: totalVolume,
                volumeWeight: volumeWeight,
            },
        };

        // 6. Generate PDF
        let url;
        try {
            url = await generateResiPDF(dataPDF);
        } catch (err) {
            throw new InternalServerErrorException(`Gagal generate PDF: ${err.message}`);
        }

        // 7. Simpan ke order_referensi
        await this.orderReferensiModel.create({
            order_id: orderId,
            nomor: noTracking,
            source: 'resi',
            url,
        });

        // 8. Return response
        return {
            message: 'Resi berhasil dibuat',
            data: {
                order_id: orderId,
                no_tracking: noTracking,
                url,
            },
        };
    }

    async addOrderHistory(orderId: number, dto: CreateOrderHistoryDto) {
        // 1. Pastikan order ada
        const order = await this.orderModel.findByPk(orderId, { raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // 2. Simpan history baru, isi field NOT NULL dari order jika tidak diisi user
        const history = await this.orderHistoryModel.create({
            order_id: orderId,
            status: dto.status,
            provinsi: (dto as any).provinsi || order.provinsi_pengirim || '-',
            kota: (dto as any).kota || order.kota_pengirim || '-',
            remark: (dto as any).keterangan || '-',
            created_at: new Date(),
            updated_at: new Date(),
        });

        return {
            message: 'Riwayat tracking berhasil ditambahkan',
            data: history,
        };
    }

    async listOrders(userId: number) {
        // Ambil orders milik user, join ke order_shipments, hitung total koli, hanya field tertentu
        const orders = await this.orderModel.findAll({
            where: { order_by: userId },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'nama_penerima',
                'layanan',
                'invoiceStatus',
                'status',
                'id_kontrak',
                'created_at',
                [fn('SUM', col('shipments.qty')), 'total_koli'],
            ],
            group: ['Order.id'],
            order: [['created_at', 'DESC']],
            raw: true,
        });
        return {
            message: 'Data order berhasil diambil',
            data: orders.map(order => ({
                id: order.id,
                no_tracking: order.no_tracking,
                nama_pengirim: order.nama_pengirim,
                nama_penerima: order.nama_penerima,
                layanan: order.layanan,
                status_tagihan: order.invoiceStatus,
                status_pengiriman: order.status,
                id_kontrak: order.id_kontrak,
                created_at: order.created_at,
                total_koli: order.total_koli,
            })),
        };
    }

    async getDashboardStatistics(userId: number) {
        // Gunakan single query dengan aggregation untuk efisiensi
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Single query dengan conditional aggregation
        const result = await this.orderModel.findOne({
            where: { order_by: userId },
            attributes: [
                [fn('COUNT', col('id')), 'total_shipment'],
                [fn('SUM', literal(`CASE WHEN status = 'Menunggu diproses' THEN 1 ELSE 0 END`)), 'on_going'],
                [fn('SUM', literal(`CASE WHEN status = 'diantarkan' THEN 1 ELSE 0 END`)), 'on_delivery'],
                [fn('SUM', literal(`CASE WHEN status = 'diterima' THEN 1 ELSE 0 END`)), 'completed'],
                [fn('SUM', literal(`CASE WHEN status = 'dibatalkan' THEN 1 ELSE 0 END`)), 'canceled'],
                [fn('SUM', literal(`CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END`)), 'payment_completed'],
                [fn('SUM', literal(`CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END`)), 'payment_pending'],
                // Monthly statistics
                [fn('SUM', literal(`CASE WHEN created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_total'],
                [fn('SUM', literal(`CASE WHEN status = 'On Going' AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_on_going'],
                [fn('SUM', literal(`CASE WHEN status = 'Completed' AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_completed'],
                [fn('SUM', literal(`CASE WHEN status = 'Canceled' AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_canceled'],
            ],
            raw: true,
        }) as any;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const payload = {
            total_shipment: parseInt(result?.total_shipment) || 0,
            on_going: parseInt(result?.on_going) || 0,
            on_delivery: parseInt(result?.on_delivery) || 0,
            completed: parseInt(result?.completed) || 0,
            canceled: parseInt(result?.canceled) || 0,
            payment_completed: parseInt(result?.payment_completed) || 0,
            payment_pending: parseInt(result?.payment_pending) || 0,
            monthly: {
                month: monthNames[currentDate.getMonth()],
                total: parseInt(result?.monthly_total) || 0,
                on_going: parseInt(result?.monthly_on_going) || 0,
                completed: parseInt(result?.monthly_completed) || 0,
                canceled: parseInt(result?.monthly_canceled) || 0,
            }
        };

        return {
            message: 'Data statistik berhasil diambil',
            data: payload,
        };
    }

    async getReorderData(orderId: number, userId: number) {
        // Ambil data order beserta pieces
        const order = await this.orderModel.findOne({
            where: {
                id: orderId,
                order_by: userId // Pastikan user hanya bisa reorder order miliknya
            },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: ['qty', 'berat', 'panjang', 'lebar', 'tinggi'],
                },
            ],
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan atau tidak memiliki akses');
        }

        // Transform data untuk response reorder
        const reorderData = {
            nama_pengirim: order.getDataValue('nama_pengirim'),
            alamat_pengirim: order.getDataValue('alamat_pengirim'),
            provinsi_pengirim: order.getDataValue('provinsi_pengirim'),
            kota_pengirim: order.getDataValue('kota_pengirim'),
            kecamatan_pengirim: order.getDataValue('kecamatan_pengirim'),
            kelurahan_pengirim: order.getDataValue('kelurahan_pengirim'),
            kodepos_pengirim: order.getDataValue('kodepos_pengirim'),
            no_telepon_pengirim: order.getDataValue('no_telepon_pengirim'),
            email_pengirim: order.getDataValue('email_pengirim'),

            nama_penerima: order.getDataValue('nama_penerima'),
            alamat_penerima: order.getDataValue('alamat_penerima'),
            provinsi_penerima: order.getDataValue('provinsi_penerima'),
            kota_penerima: order.getDataValue('kota_penerima'),
            kecamatan_penerima: order.getDataValue('kecamatan_penerima'),
            kelurahan_penerima: order.getDataValue('kelurahan_penerima'),
            kodepos_penerima: order.getDataValue('kodepos_penerima'),
            no_telepon_penerima: order.getDataValue('no_telepon_penerima'),
            email_penerima: order.getDataValue('email_penerima'),

            layanan: order.getDataValue('layanan'),
            asuransi: order.getDataValue('asuransi') === 1,
            harga_barang: order.getDataValue('harga_barang'),
            nama_barang: order.getDataValue('nama_barang'),

            // pakek order.shipments
            pieces: order.getDataValue('shipments')?.map(shipment => ({
                qty: shipment.getDataValue('qty'),
                berat: shipment.getDataValue('berat'),
                panjang: shipment.getDataValue('panjang'),
                lebar: shipment.getDataValue('lebar'),
                tinggi: shipment.getDataValue('tinggi'),
            })) || [],
        };

        return {
            message: 'Data reorder berhasil diambil',
            data: reorderData,
        };
    }

    async getOrderHistoryByOrderId(orderId: number) {
        // Ambil data order
        const order = await this.orderModel.findByPk(orderId, { raw: true });
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Ambil histories
        const histories = await this.orderHistoryModel.findAll({
            where: { order_id: orderId },
            order: [['created_at', 'DESC'], ['id', 'DESC']],
            raw: true,
        });

        const payload = {
            order: {
                no_tracking: order.no_tracking,
                pengirim: {
                    nama: order.nama_pengirim,
                    alamat: order.alamat_pengirim,
                    provinsi: order.provinsi_pengirim,
                    kota: order.kota_pengirim,
                    kecamatan: order.kecamatan_pengirim,
                    kelurahan: order.kelurahan_pengirim,
                    kodepos: order.kodepos_pengirim,
                    telepon: order.no_telepon_pengirim,
                    email: order.email_pengirim
                },
                penerima: {
                    nama: order.nama_penerima,
                    alamat: order.alamat_penerima,
                    provinsi: order.provinsi_penerima,
                    kota: order.kota_penerima,
                    kecamatan: order.kecamatan_penerima,
                    kelurahan: order.kelurahan_penerima,
                    kodepos: order.kodepos_penerima,
                    telepon: order.no_telepon_penerima,
                    email: order.email_penerima
                }
            },
            histories: histories.map(h => ({
                id: h.id,
                status: h.status,
                remark: h.remark,
                created_at: h.created_at,
            }))
        };

        return {
            message: 'Data riwayat order berhasil diambil',
            data: payload,
        };
    }

    async exportToExcel(userId: number) {
        const orders = await this.orderModel.findAll({
            where: { order_by: userId },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'nama_penerima',
                'layanan',
                'payment_status',
                'status',
                'id_kontrak',
                'created_at',
                [fn('SUM', col('shipments.qty')), 'total_koli'],
            ],
            group: ['Order.id'],
            order: [['created_at', 'DESC']],
            raw: true,
        });

        const worksheetName = 'Pengiriman';

        const data = orders.map(order => ({
            No: order.id,
            Tracking: order.no_tracking,
            Pengirim: order.nama_pengirim,
            Penerima: order.nama_penerima,
            layanan: order.layanan,
            Pembayaran: order.payment_status || 'belum lunas',
            status: order.status,
            kontrak: order.id_kontrak === '1' ? 'iya' : 'tidak',
            date: order.created_at,
            total_koli: (order as any).total_koli,
        }));

        const currentDate = new Date();
        const fileName = `Data-${currentDate.toString().replace(/[:\s]/g, '')}.xlsx`;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
        XLSX.writeFile(workbook, `public/excel/${fileName}`);

        return {
            message: 'Data pengiriman berhasil diekspor ke Excel',
            data: {
                file_name: fileName,
                url: `/excel/${fileName}`
            },
        };
    }

    async exportToPdf(userId: number) {
        const orders = await this.orderModel.findAll({
            where: { order_by: userId },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'nama_penerima',
                'layanan',
                'payment_status',
                'status',
                'id_kontrak',
                'created_at',
                [fn('SUM', col('shipments.qty')), 'total_koli'],
            ],
            group: ['Order.id'],
            order: [['created_at', 'DESC']],
            raw: true,
        });

        const currentDate = new Date();
        const tanggal = currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const jam = currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
        const fileName = `Laporan-Order-${tanggal.replace(/\s/g, '-')}-${jam.replace(/:/g, '')}.pdf`;
        const filePath = `public/pdf/${fileName}`;

        // Generate PDF (landscape)
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const fs = require('fs');
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Judul formal
        doc.fontSize(16).text(`Laporan Order - ${tanggal} pukul ${jam} WIB`, { align: 'center' });
        doc.moveDown(1.5);

        // Table columns (lebar diatur agar tidak padat, Kontrak diperlebar, Tracking & Date cukup lebar)
        const columns = [
            { label: 'No', width: 35 },
            { label: 'Tracking', width: 130 },
            { label: 'Pengirim', width: 90 },
            { label: 'Penerima', width: 90 },
            { label: 'Layanan', width: 70 },
            { label: 'Pembayaran', width: 90 },
            { label: 'Status', width: 110 },
            { label: 'Kontrak', width: 70 },
            { label: 'Date', width: 130 },
        ];

        // Center table horizontally
        const tableWidth = columns.reduce((a, c) => a + c.width, 0);
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        let startX = doc.page.margins.left + Math.max(0, Math.floor((pageWidth - tableWidth) / 2));
        let startY = doc.y;

        // Header background (hijau #1A723B)
        doc.save();
        doc.rect(startX, startY, tableWidth, 22).fill('#1A723B');
        doc.restore();

        // Header text
        let x = startX;
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        columns.forEach(col => {
            doc.text(col.label, x + 2, startY + 6, { width: col.width - 4, align: 'left' });
            x += col.width;
        });
        doc.fillColor('black').font('Helvetica').fontSize(10);

        // Table rows
        let y = startY + 22;
        orders.forEach((order: any, idx: number) => {
            // Alternating row background
            if (idx % 2 === 0) {
                doc.save();
                doc.rect(startX, y, tableWidth, 22).fill('#f3f3f3');
                doc.restore();
            }
            x = startX;
            const row = [
                String(idx + 1),
                order.no_tracking || '-',
                order.nama_pengirim || '-',
                order.nama_penerima || '-',
                order.layanan || '-',
                order.payment_status || 'Unpaid',
                order.status || '-',
                order.id_kontrak === '1' ? 'Iya' : 'Tidak',
                order.created_at ? new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
            ];
            row.forEach((cell, i) => {
                doc.fillColor('black').font('Helvetica').fontSize(10);
                doc.text(cell, x + 2, y + 6, { width: columns[i].width - 4, align: 'left' });
                x += columns[i].width;
            });
            y += 22;
            // Page break jika melebihi halaman
            if (y > doc.page.height - 50) {
                doc.addPage();
                y = 30;
                // Redraw header di halaman baru
                doc.save();
                doc.rect(startX, y, tableWidth, 22).fill('#1A723B');
                doc.restore();
                x = startX;
                doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
                columns.forEach(col => {
                    doc.text(col.label, x + 2, y + 6, { width: col.width - 4, align: 'left' });
                    x += col.width;
                });
                doc.fillColor('black').font('Helvetica').fontSize(10);
                y += 22;
            }
        });

        doc.end();

        // Tunggu file selesai ditulis
        await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });

        return {
            message: 'Data pengiriman berhasil diekspor ke PDF',
            data: {
                file_name: fileName,
                url: `/pdf/${fileName}`
            },
        };
    }

    async cancelOrder(noResi: string, body: any) {
        const { reason, cancelled_by_user_id } = body;

        this.logger.log(`Starting cancel order process for no_resi: ${noResi}, user_id: ${cancelled_by_user_id}`);

        try {
            // 1. Validasi user
            const user = await this.userModel.findByPk(cancelled_by_user_id);
            if (!user) {
                this.logger.error(`User not found: ${cancelled_by_user_id}`);
                throw new Error('User tidak ditemukan');
            }

            // 2. Cari order berdasarkan no_tracking (no_resi)
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi }
            });
            if (!order) {
                this.logger.error(`Order not found: ${noResi}`);
                throw new Error('Order tidak ditemukan');
            }

            const orderId = order.getDataValue('id');
            this.logger.log(`Found order: ${orderId} with status: ${order.getDataValue('status')}`);

            // 3. Validasi status order (tidak bisa dibatalkan jika sudah delivered atau cancelled)
            const currentStatus = order.getDataValue('status');
            if (currentStatus === 'Delivered' || currentStatus === 'Cancelled' || currentStatus === 'dibatalkan') {
                this.logger.warn(`Order ${orderId} cannot be cancelled - current status: ${currentStatus}`);
                throw new Error('Order tidak bisa dibatalkan karena sudah delivered atau cancelled');
            }

            const updateHistory: string[] = [];

            // 4. Update order status menjadi 'Cancelled'
            await order.update({
                status: 'Cancelled',
                is_gagal_pickup: 1,
                remark_traffic: reason,
                updated_at: new Date()
            });

            updateHistory.push('Status order diubah menjadi Cancelled');
            updateHistory.push('Flag is_gagal_pickup diatur menjadi 1');

            // 5. Buat entri baru di request_cancel
            await this.requestCancelModel.create({
                order_id: orderId,
                user_id: cancelled_by_user_id,
                reason: reason,
                status: 0, // 0: Pending
                created_at: new Date()
            } as any);

            updateHistory.push('Request cancel berhasil dibuat');

            // 6. Update status order_pieces menjadi 0 (tidak di-pickup)
            const pieces = await this.orderPieceModel.findAll({
                where: { order_id: orderId }
            });

            if (pieces.length > 0) {
                await this.orderPieceModel.update({
                    pickup_status: 0
                }, {
                    where: { order_id: orderId }
                });

                updateHistory.push(`${pieces.length} pieces diupdate menjadi tidak di-pickup`);
            }

            // 7. Tambah entri riwayat di order_histories
            await this.addOrderHistory(orderId, {
                status: 'Order Cancelled',
                remark: reason,
                created_by: cancelled_by_user_id
            } as any);

            updateHistory.push('History order berhasil ditambahkan');

            this.logger.log(`Order ${orderId} successfully cancelled`);

            return {
                message: 'Order berhasil dibatalkan',
                success: true,
                data: {
                    order_id: orderId,
                    no_resi: noResi,
                    status: 'Cancelled',
                    reason: reason,
                    cancelled_by: user.getDataValue('name'),
                    cancelled_at: new Date().toISOString(),
                    updates: updateHistory
                }
            };

        } catch (error) {
            this.logger.error(`Error in cancelOrder: ${error.message}`, error.stack);
            throw new Error(`Error cancelling order: ${error.message}`);
        }
    }

    private validateOrderData(createOrderDto: CreateOrderDto): void {
        // Validasi asuransi
        if (createOrderDto.asuransi && (!createOrderDto.harga_barang || createOrderDto.harga_barang <= 0)) {
            throw new BadRequestException('Harga barang wajib diisi jika asuransi aktif');
        }

        // Validasi pieces tidak kosong
        if (!createOrderDto.pieces || createOrderDto.pieces.length === 0) {
            throw new BadRequestException('Detail paket/koli wajib diisi');
        }

        // Validasi setiap piece
        createOrderDto.pieces.forEach((piece, index) => {
            if (piece.berat <= 0) {
                throw new BadRequestException(`Berat pada koli ${index + 1} harus lebih dari 0`);
            }
            if (piece.panjang <= 0 || piece.lebar <= 0 || piece.tinggi <= 0) {
                throw new BadRequestException(`Dimensi pada koli ${index + 1} harus lebih dari 0`);
            }
        });
    }

    private calculateShipmentData(pieces: CreateOrderPieceDto[]) {
        let totalWeight = 0;
        let totalQty = 0;
        let totalVolume = 0;

        pieces.forEach((piece) => {
            const qty = Number(piece.qty) || 0;
            const berat = Number(piece.berat) || 0;
            const panjang = Number(piece.panjang) || 0;
            const lebar = Number(piece.lebar) || 0;
            const tinggi = Number(piece.tinggi) || 0;

            totalQty += qty;
            totalWeight += berat * qty;
            const volume = (panjang * lebar * tinggi * qty) / 1000000;
            totalVolume += volume;
        });

        const volumeWeight = totalVolume * 250;

        return {
            totalKoli: totalQty,
            totalBerat: totalWeight,
            totalVolume,
            beratVolume: volumeWeight,
        };
    }

    private calculateVolume(panjang: number, lebar: number, tinggi: number): number {
        return (panjang * lebar * tinggi) / 1000000; // Convert to meter kubik
    }

    private calculateBeratVolume(panjang: number, lebar: number, tinggi: number): number {
        const volume = this.calculateVolume(panjang, lebar, tinggi);
        return volume * 250;
    }

    async reweightPiece(pieceId: number, reweightDto: ReweightPieceDto): Promise<ReweightPieceResponseDto> {
        const {
            berat,
            panjang,
            lebar,
            tinggi,
            reweight_by_user_id,
        } = reweightDto;

        // Validasi piece exists
        const piece = await this.orderPieceModel.findByPk(pieceId, {
            include: [
                {
                    model: this.orderModel,
                    as: 'order',
                    attributes: ['id', 'no_tracking', 'provinsi_pengirim', 'kota_pengirim'],
                },
            ],
        });

        if (!piece) {
            throw new NotFoundException('Piece tidak ditemukan');
        }

        // Validasi pickup status - piece harus sudah di-pickup
        // if (piece.getDataValue('pickup_status') !== 1) {
        //     throw new BadRequestException('Piece belum di-pickup. Reweight hanya bisa dilakukan setelah pickup');
        // }

        // Validasi piece belum di-reweight
        if (piece.getDataValue('reweight_status') === 1) {
            throw new BadRequestException('Piece sudah di-reweight sebelumnya');
        }

        // Simpan data lama untuk history
        const oldBerat = piece.getDataValue('berat');
        const oldPanjang = piece.getDataValue('panjang');
        const oldLebar = piece.getDataValue('lebar');
        const oldTinggi = piece.getDataValue('tinggi');

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const now = new Date();

            // 1. Update order_pieces
            await this.orderPieceModel.update(
                {
                    berat,
                    panjang,
                    lebar,
                    tinggi,
                    reweight_status: 1,
                    reweight_by: reweight_by_user_id,
                    updatedAt: now,
                },
                {
                    where: { id: pieceId },
                    transaction,
                }
            );

            // 2. Check if all pieces in the order have been reweighted
            // Kita perlu menghitung ulang setelah piece ini diupdate
            const orderId = piece.getDataValue('order_id');

            // Hitung jumlah pieces yang belum di-reweight
            const unreweightedCount = await this.orderPieceModel.count({
                where: {
                    order_id: orderId,
                    reweight_status: { [Op.ne]: 1 } // Tidak sama dengan 1
                },
                transaction,
            });

            const totalPieces = await this.orderPieceModel.count({
                where: { order_id: orderId },
                transaction,
            });

            const allReweighted = unreweightedCount === 0 && totalPieces > 0;

            // 3. Update order reweight status if all pieces are reweighted
            if (allReweighted) {
                await this.orderModel.update(
                    {
                        reweight_status: 1,
                        isUnreweight: 0,
                        remark_reweight: 'Semua pieces telah di-reweight',
                        invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH, // Update invoiceStatus menjadi "belum ditagih"
                    },
                    {
                        where: { id: orderId },
                        transaction,
                    }
                );

                // Update order status based on pieces
                await this.updateOrderStatusFromPieces(orderId, transaction);
            }


            await transaction.commit();

            return {
                message: 'Piece berhasil di-reweight',
                success: true,
                data: {
                    piece_id: pieceId,
                    order_id: orderId,
                    berat_lama: oldBerat,
                    berat_baru: berat,
                    dimensi_lama: `${oldPanjang}x${oldLebar}x${oldTinggi}`,
                    dimensi_baru: `${panjang}x${lebar}x${tinggi}`,
                    reweight_status: 1,
                    order_reweight_completed: allReweighted,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    async getOrderDetail(noResi: string): Promise<OrderDetailResponseDto> {
        try {
            // 1. Get order with all related data
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi },
                include: [
                    {
                        model: this.orderPieceModel,
                        as: 'pieces',
                        attributes: [
                            'id',
                            'piece_id',
                            'berat',
                            'panjang',
                            'lebar',
                            'tinggi',
                            'reweight_status',
                            'pickup_status'
                        ],
                        required: false
                    }
                ],
                attributes: [
                    'id',
                    'no_tracking',
                    'nama_barang',
                    'harga_barang',
                    'status',
                    'bypass_reweight',
                    'layanan',
                    'created_at',
                    'updated_at',
                    // Shipper data
                    'nama_pengirim',
                    'alamat_pengirim',
                    'provinsi_pengirim',
                    'kota_pengirim',
                    'kecamatan_pengirim',
                    'kelurahan_pengirim',
                    'kodepos_pengirim',
                    'no_telepon_pengirim',
                    'email_pengirim',
                    // Consignee data
                    'nama_penerima',
                    'alamat_penerima',
                    'provinsi_penerima',
                    'kota_penerima',
                    'kecamatan_penerima',
                    'kelurahan_penerima',
                    'kodepos_penerima',
                    'no_telepon_penerima',
                    'email_penerima',
                    // Additional data
                    'total_harga'
                ]
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // 2. Calculate summary metrics from pieces
            const pieces = order.getDataValue('pieces') || [];
            let jumlahKoli = 0;
            let beratAktual = 0;
            let beratVolume = 0;
            let kubikasi = 0;

            pieces.forEach((piece: any) => {
                jumlahKoli += 1; // Each piece = 1 koli

                const berat = parseFloat(piece.getDataValue('berat')) || 0;
                const panjang = parseFloat(piece.getDataValue('panjang')) || 0;
                const lebar = parseFloat(piece.getDataValue('lebar')) || 0;
                const tinggi = parseFloat(piece.getDataValue('tinggi')) || 0;

                beratAktual += berat;

                // Calculate volume weight (panjang * lebar * tinggi) / 6000
                const volumeWeight = (panjang * lebar * tinggi) / 6000;
                beratVolume += volumeWeight;

                // Calculate cubic meter (panjang * lebar * tinggi) / 1000000
                const cubicMeter = (panjang * lebar * tinggi) / 1000000;
                kubikasi += cubicMeter;
            });

            // 3. Build response
            const response: OrderDetailResponseDto = {
                message: 'Detail order berhasil diambil',
                success: true,
                data: {
                    order_info: {
                        tracking_no: order.getDataValue('no_tracking'),
                        nama_barang: order.getDataValue('nama_barang'),
                        harga_barang: parseFloat(order.getDataValue('harga_barang')) || 0,
                        status: order.getDataValue('status') || ORDER_STATUS.DRAFT,
                        bypass_reweight: order.getDataValue('bypass_reweight') || 'false',
                        layanan: order.getDataValue('layanan') || 'Regular',
                        created_at: order.getDataValue('created_at'),
                        updated_at: order.getDataValue('updated_at')
                    },
                    shipper: {
                        name: order.getDataValue('nama_pengirim'),
                        address: order.getDataValue('alamat_pengirim'),
                        phone: order.getDataValue('no_telepon_pengirim'),
                        email: order.getDataValue('email_pengirim'),
                        province: order.getDataValue('provinsi_pengirim'),
                        city: order.getDataValue('kota_pengirim'),
                        district: order.getDataValue('kecamatan_pengirim'),
                        postal_code: order.getDataValue('kodepos_pengirim')
                    },
                    consignee: {
                        name: order.getDataValue('nama_penerima'),
                        address: order.getDataValue('alamat_penerima'),
                        phone: order.getDataValue('no_telepon_penerima'),
                        email: order.getDataValue('email_penerima'),
                        province: order.getDataValue('provinsi_penerima'),
                        city: order.getDataValue('kota_penerima'),
                        district: order.getDataValue('kecamatan_penerima'),
                        postal_code: order.getDataValue('kodepos_penerima')
                    },
                    summary_metrics: {
                        jumlah_koli: jumlahKoli,
                        berat_aktual_kg: Math.round(beratAktual * 100) / 100, // Round to 2 decimals
                        berat_volume_kg: Math.round(beratVolume * 100) / 100,
                        kubikasi_m3: Math.round(kubikasi * 1000) / 1000, // Round to 3 decimals
                        total_harga: parseFloat(order.getDataValue('total_harga')) || 0
                    },
                    pieces_detail: pieces.map((piece: any, index: number) => ({
                        id: piece.getDataValue('id'),
                        piece_id: piece.getDataValue('piece_id'),
                        qty: 1, // Each piece = 1 qty
                        berat: parseFloat(piece.getDataValue('berat')) || 0,
                        panjang: parseFloat(piece.getDataValue('panjang')) || 0,
                        lebar: parseFloat(piece.getDataValue('lebar')) || 0,
                        tinggi: parseFloat(piece.getDataValue('tinggi')) || 0,
                        reweight_status: piece.getDataValue('reweight_status') || 0,
                        pickup_status: piece.getDataValue('pickup_status') || 0
                    }))
                }
            };

            return response;

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting order detail: ${error.message}`);
        }
    }

    async estimatePrice(estimateDto: EstimatePriceDto) {
        const { origin, destination, item_details, service_options } = estimateDto;

        // Validasi layanan jika diisi
        const validServices = ['Ekonomi', 'Reguler', 'Kirim Motor', 'Paket', 'Express', 'Sewa Truk'];
        if (service_options.layanan && !validServices.includes(service_options.layanan)) {
            throw new BadRequestException('Layanan tidak valid');
        }

        // Validasi motor_type untuk layanan Kirim Motor
        if (service_options.layanan === 'Kirim Motor' && !service_options.motor_type) {
            throw new BadRequestException('Motor type wajib diisi untuk layanan Kirim Motor');
        }

        // Validasi truck_type untuk layanan Sewa Truk
        if (service_options.layanan === 'Sewa Truk' && !service_options.truck_type) {
            throw new BadRequestException('Truck type wajib diisi untuk layanan Sewa Truk');
        }

        // Hitung total dari semua items
        let totalWeight = 0;
        let totalVolume = 0;
        let totalBeratVolume = 0;
        const itemBreakdown: any[] = [];

        item_details.items.forEach((item, index) => {
            const qty = Number(item.qty) || 0;
            const berat = Number(item.berat) || 0;
            const panjang = Number(item.panjang) || 0;
            const lebar = Number(item.lebar) || 0;
            const tinggi = Number(item.tinggi) || 0;

            // Hitung per item
            const itemWeight = berat * qty;
            let itemVolume = 0;
            let itemBeratVolume = 0;

            if (panjang && lebar && tinggi) {
                itemVolume = this.calculateVolume(panjang, lebar, tinggi) * qty;
                itemBeratVolume = this.calculateBeratVolume(panjang, lebar, tinggi) * qty;
            }

            // Akumulasi total
            totalWeight += itemWeight;
            totalVolume += itemVolume;
            totalBeratVolume += itemBeratVolume;

            // Simpan breakdown per item
            itemBreakdown.push({
                item_index: index + 1,
                qty,
                berat_per_unit: berat,
                total_berat: itemWeight,
                volume: itemVolume,
                berat_volume: itemBeratVolume,
                dimensi: panjang && lebar && tinggi ? `${panjang}x${lebar}x${tinggi} cm` : 'Tidak tersedia',
            });
        });

        // Chargeable weight = max(total berat aktual, total berat volume)
        const chargeableWeight = Math.max(totalWeight, totalBeratVolume);

        // Fungsi untuk menghitung harga berdasarkan layanan
        const calculateServicePrice = (layanan: string) => {
            let basePrice = 0;
            let estimatedDays = 0;
            let serviceDescription = '';
            let isValid = true;
            let errorMessage = '';

            switch (layanan) {
                case 'Ekonomi':
                    basePrice = chargeableWeight * 3000; // Rp3.000/kg
                    estimatedDays = 4;
                    serviceDescription = 'Layanan ekonomi dengan estimasi 3-4+ hari';
                    break;

                case 'Reguler':
                    basePrice = chargeableWeight * 6000; // Rp6.000/kg
                    estimatedDays = 3;
                    serviceDescription = 'Layanan reguler dengan estimasi 2-4 hari';
                    break;

                case 'Paket':
                    if (totalWeight <= 25) {
                        basePrice = 15000; // Rp15.000
                        estimatedDays = 2;
                        serviceDescription = 'Layanan paket dengan batas maksimal 25kg';
                    } else {
                        isValid = false;
                        errorMessage = 'Berat melebihi batas maksimal 25kg untuk layanan Paket';
                    }
                    break;

                case 'Express':
                    // Estimasi jarak sederhana (bisa dikembangkan dengan API maps)
                    const estimatedDistance = 10; // km
                    basePrice = 10000 + (estimatedDistance * 3000); // Base + (jarak × Rp3.000/km)
                    estimatedDays = 1;
                    serviceDescription = 'Layanan express same day delivery';
                    break;

                case 'Kirim Motor':
                    if (service_options.motor_type) {
                        if (service_options.motor_type === '125cc') {
                            basePrice = 120000; // Rp120.000
                        } else {
                            basePrice = 150000; // Rp150.000
                        }
                        estimatedDays = 5;
                        serviceDescription = `Layanan kirim motor ${service_options.motor_type}`;
                    } else {
                        isValid = false;
                        errorMessage = 'Motor type wajib diisi untuk layanan Kirim Motor';
                    }
                    break;

                case 'Sewa Truk':
                    if (service_options.truck_type) {
                        if (service_options.truck_type === 'Pick Up') {
                            basePrice = 300000; // Rp300.000
                        } else {
                            basePrice = 800000; // Rp800.000
                        }
                        // Tambahan biaya per km
                        const truckDistance = 20; // km
                        basePrice += truckDistance * 2000; // Rp2.000/km
                        estimatedDays = 2;
                        serviceDescription = `Layanan sewa truk ${service_options.truck_type}`;
                    } else {
                        isValid = false;
                        errorMessage = 'Truck type wajib diisi untuk layanan Sewa Truk';
                    }
                    break;

                default:
                    isValid = false;
                    errorMessage = 'Layanan tidak dikenali';
                    break;
            }

            return {
                layanan,
                basePrice,
                estimatedDays,
                serviceDescription,
                isValid,
                errorMessage
            };
        };

        // Jika layanan tidak diisi, hitung untuk semua layanan yang relevan
        if (!service_options.layanan) {
            const servicesToCalculate = ['Ekonomi', 'Reguler', 'Paket', 'Express'];
            const allServices = servicesToCalculate.map(service => calculateServicePrice(service));

            // Hitung biaya tambahan dan diskon untuk setiap layanan
            const servicesWithPricing = allServices.map(service => {
                if (!service.isValid) {
                    return {
                        ...service,
                        pricing: null,
                        estimatedDeliveryDate: null
                    };
                }

                // Hitung biaya tambahan
                let additionalCosts = 0;
                const additionalServices: any[] = [];

                if (service_options.asuransi) {
                    const asuransiCost = service.basePrice * 0.02; // 2% dari harga dasar
                    additionalCosts += asuransiCost;
                    additionalServices.push({
                        service: 'Asuransi',
                        cost: asuransiCost,
                        description: 'Asuransi pengiriman 2% dari harga dasar'
                    });
                }

                if (service_options.packing) {
                    const packingCost = 5000; // Rp5.000
                    additionalCosts += packingCost;
                    additionalServices.push({
                        service: 'Packing',
                        cost: packingCost,
                        description: 'Packing tambahan'
                    });
                }

                // Hitung diskon voucher (jika ada)
                let discountAmount = 0;
                let voucherInfo: any = null;

                if (service_options.voucher_code) {
                    if (service_options.voucher_code === 'DISKONAKHIRBULAN') {
                        discountAmount = service.basePrice * 0.1; // 10% diskon
                        voucherInfo = {
                            code: service_options.voucher_code,
                            discount_percentage: 10,
                            discount_amount: discountAmount,
                            description: 'Diskon akhir bulan 10%'
                        };
                    }
                }

                // Hitung total harga
                const subtotal = service.basePrice + additionalCosts;
                const totalPrice = subtotal - discountAmount;

                // Estimasi waktu transit
                const estimatedDeliveryDate = new Date();
                estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + service.estimatedDays);

                return {
                    ...service,
                    pricing: {
                        base_price: service.basePrice,
                        additional_services: additionalServices,
                        subtotal: subtotal,
                        voucher: voucherInfo,
                        discount_amount: discountAmount,
                        total_price: totalPrice,
                    },
                    estimatedDeliveryDate: estimatedDeliveryDate.toISOString().split('T')[0]
                };
            });

            return {
                message: 'Estimasi harga untuk semua layanan berhasil dihitung',
                success: true,
                data: {
                    origin: {
                        provinsi: origin.provinsi,
                        kota: origin.kota,
                        kecamatan: origin.kecamatan,
                        kelurahan: origin.kelurahan,
                        kodepos: origin.kodepos,
                    },
                    destination: {
                        provinsi: destination.provinsi,
                        kota: destination.kota,
                        kecamatan: destination.kecamatan,
                        kelurahan: destination.kelurahan,
                        kodepos: destination.kodepos,
                    },
                    item_details: {
                        total_berat_aktual: totalWeight,
                        total_berat_volume: totalBeratVolume,
                        chargeable_weight: chargeableWeight,
                        total_volume: totalVolume,
                        total_qty: item_details.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
                        items_breakdown: itemBreakdown,
                    },
                    service_options: {
                        asuransi: service_options.asuransi || false,
                        packing: service_options.packing || false,
                        voucher_code: service_options.voucher_code || null,
                    },
                    services: servicesWithPricing
                }
            };
        }

        // Jika layanan diisi, hitung untuk layanan spesifik
        const serviceResult = calculateServicePrice(service_options.layanan);

        if (!serviceResult.isValid) {
            throw new BadRequestException(serviceResult.errorMessage);
        }

        const { basePrice, estimatedDays, serviceDescription } = serviceResult;

        // Hitung biaya tambahan
        let additionalCosts = 0;
        const additionalServices: any[] = [];

        if (service_options.asuransi) {
            const asuransiCost = basePrice * 0.02; // 2% dari harga dasar
            additionalCosts += asuransiCost;
            additionalServices.push({
                service: 'Asuransi',
                cost: asuransiCost,
                description: 'Asuransi pengiriman 2% dari harga dasar'
            });
        }

        if (service_options.packing) {
            const packingCost = 5000; // Rp5.000
            additionalCosts += packingCost;
            additionalServices.push({
                service: 'Packing',
                cost: packingCost,
                description: 'Packing tambahan'
            });
        }

        // Hitung diskon voucher (jika ada)
        let discountAmount = 0;
        let voucherInfo: any = null;

        if (service_options.voucher_code) {
            // Simulasi validasi voucher (bisa dikembangkan dengan tabel voucher)
            if (service_options.voucher_code === 'DISKONAKHIRBULAN') {
                discountAmount = basePrice * 0.1; // 10% diskon
                voucherInfo = {
                    code: service_options.voucher_code,
                    discount_percentage: 10,
                    discount_amount: discountAmount,
                    description: 'Diskon akhir bulan 10%'
                };
            }
        }

        // Hitung total harga
        const subtotal = basePrice + additionalCosts;
        const totalPrice = subtotal - discountAmount;

        // Estimasi waktu transit
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays);

        return {
            message: 'Estimasi harga berhasil dihitung',
            success: true,
            data: {
                origin: {
                    provinsi: origin.provinsi,
                    kota: origin.kota,
                    kecamatan: origin.kecamatan,
                    kelurahan: origin.kelurahan,
                    kodepos: origin.kodepos,
                },
                destination: {
                    provinsi: destination.provinsi,
                    kota: destination.kota,
                    kecamatan: destination.kecamatan,
                    kelurahan: destination.kelurahan,
                    kodepos: destination.kodepos,
                },
                item_details: {
                    total_berat_aktual: totalWeight,
                    total_berat_volume: totalBeratVolume,
                    chargeable_weight: chargeableWeight,
                    total_volume: totalVolume,
                    total_qty: item_details.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
                    items_breakdown: itemBreakdown,
                },
                service_details: {
                    layanan: service_options.layanan,
                    description: serviceDescription,
                    estimated_days: estimatedDays,
                    estimated_delivery_date: estimatedDeliveryDate.toISOString().split('T')[0],
                },
                pricing: {
                    base_price: basePrice,
                    additional_services: additionalServices,
                    subtotal: subtotal,
                    voucher: voucherInfo,
                    discount_amount: discountAmount,
                    total_price: totalPrice,
                },
                breakdown: {
                    base_service: basePrice,
                    additional_costs: additionalCosts,
                    discount: discountAmount,
                    total: totalPrice,
                },
            },
        };
    }

    async updateOrder(noResi: string, updateOrderDto: UpdateOrderDto): Promise<UpdateOrderResponseDto> {
        // Find order by no_resi
        const order = await this.orderModel.findOne({
            where: { no_tracking: noResi }
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Validate user permissions (basic check - can be enhanced)
        if (!updateOrderDto.updated_by_user_id) {
            throw new BadRequestException('User ID diperlukan untuk audit trail');
        }

        // Check if order can be updated based on current status
        this.validateOrderUpdatePermission(order);

        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const updatedFields: string[] = [];

            // Update order details
            const orderUpdateData: any = {
                updated_at: new Date(),
            };

            // Check and update order info fields
            if (updateOrderDto.nama_barang !== undefined) {
                orderUpdateData.nama_barang = updateOrderDto.nama_barang;
                updatedFields.push('nama_barang');
            }
            if (updateOrderDto.harga_barang !== undefined) {
                orderUpdateData.harga_barang = updateOrderDto.harga_barang;
                updatedFields.push('harga_barang');
            }
            if (updateOrderDto.status !== undefined) {
                orderUpdateData.status = updateOrderDto.status;
                updatedFields.push('status');
            }
            if (updateOrderDto.layanan !== undefined) {
                orderUpdateData.layanan = updateOrderDto.layanan;
                updatedFields.push('layanan');
            }

            // Check and update shipper fields
            if (updateOrderDto.nama_pengirim !== undefined) {
                orderUpdateData.nama_pengirim = updateOrderDto.nama_pengirim;
                updatedFields.push('nama_pengirim');
            }
            if (updateOrderDto.alamat_pengirim !== undefined) {
                orderUpdateData.alamat_pengirim = updateOrderDto.alamat_pengirim;
                updatedFields.push('alamat_pengirim');
            }
            if (updateOrderDto.no_telepon_pengirim !== undefined) {
                orderUpdateData.no_telepon_pengirim = updateOrderDto.no_telepon_pengirim;
                updatedFields.push('no_telepon_pengirim');
            }
            if (updateOrderDto.email_pengirim !== undefined) {
                orderUpdateData.email_pengirim = updateOrderDto.email_pengirim;
                updatedFields.push('email_pengirim');
            }
            if (updateOrderDto.provinsi_pengirim !== undefined) {
                orderUpdateData.provinsi_pengirim = updateOrderDto.provinsi_pengirim;
                updatedFields.push('provinsi_pengirim');
            }
            if (updateOrderDto.kota_pengirim !== undefined) {
                orderUpdateData.kota_pengirim = updateOrderDto.kota_pengirim;
                updatedFields.push('kota_pengirim');
            }
            if (updateOrderDto.kecamatan_pengirim !== undefined) {
                orderUpdateData.kecamatan_pengirim = updateOrderDto.kecamatan_pengirim;
                updatedFields.push('kecamatan_pengirim');
            }
            if (updateOrderDto.kelurahan_pengirim !== undefined) {
                orderUpdateData.kelurahan_pengirim = updateOrderDto.kelurahan_pengirim;
                updatedFields.push('kelurahan_pengirim');
            }
            if (updateOrderDto.kodepos_pengirim !== undefined) {
                orderUpdateData.kodepos_pengirim = updateOrderDto.kodepos_pengirim;
                updatedFields.push('kodepos_pengirim');
            }

            // Check and update consignee fields
            if (updateOrderDto.nama_penerima !== undefined) {
                orderUpdateData.nama_penerima = updateOrderDto.nama_penerima;
                updatedFields.push('nama_penerima');
            }
            if (updateOrderDto.alamat_penerima !== undefined) {
                orderUpdateData.alamat_penerima = updateOrderDto.alamat_penerima;
                updatedFields.push('alamat_penerima');
            }
            if (updateOrderDto.no_telepon_penerima !== undefined) {
                orderUpdateData.no_telepon_penerima = updateOrderDto.no_telepon_penerima;
                updatedFields.push('no_telepon_penerima');
            }
            if (updateOrderDto.email_penerima !== undefined) {
                orderUpdateData.email_penerima = updateOrderDto.email_penerima;
                updatedFields.push('email_penerima');
            }
            if (updateOrderDto.provinsi_penerima !== undefined) {
                orderUpdateData.provinsi_penerima = updateOrderDto.provinsi_penerima;
                updatedFields.push('provinsi_penerima');
            }
            if (updateOrderDto.kota_penerima !== undefined) {
                orderUpdateData.kota_penerima = updateOrderDto.kota_penerima;
                updatedFields.push('kota_penerima');
            }
            if (updateOrderDto.kecamatan_penerima !== undefined) {
                orderUpdateData.kecamatan_penerima = updateOrderDto.kecamatan_penerima;
                updatedFields.push('kecamatan_penerima');
            }
            if (updateOrderDto.kelurahan_penerima !== undefined) {
                orderUpdateData.kelurahan_penerima = updateOrderDto.kelurahan_penerima;
                updatedFields.push('kelurahan_penerima');
            }
            if (updateOrderDto.kodepos_penerima !== undefined) {
                orderUpdateData.kodepos_penerima = updateOrderDto.kodepos_penerima;
                updatedFields.push('kodepos_penerima');
            }

            // Update order if there are changes
            if (Object.keys(orderUpdateData).length > 1) { // More than just updated_at
                await this.orderModel.update(orderUpdateData, {
                    where: { id: order.id },
                    transaction
                });
            }

            // Audit trail removed - no longer creating order_histories entry

            await transaction.commit();

            return {
                message: 'Order berhasil diperbarui',
                success: true,
                data: {
                    no_resi: noResi,
                    updated_fields: updatedFields,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private validateOrderUpdatePermission(order: Order): void {
        // Check if order can be updated based on current status
        const restrictedStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED];

        if (restrictedStatuses.includes(order.status as any)) {
            throw new BadRequestException(`Order dengan status '${order.status}' tidak dapat diperbarui`);
        }

        // Additional business logic can be added here
        // For example, check if order is already picked up
        if ((order.getDataValue('status_pickup') as any) === 1) {
            // Maybe restrict certain field updates
        }
    }

    private async recalculateOrderTotals(orderId: number, transaction: Transaction): Promise<void> {
        const pieces = await this.orderPieceModel.findAll({
            where: { order_id: orderId },
            transaction
        });

        let totalBerat = 0;
        let totalKoli = pieces.length;

        for (const piece of pieces) {
            totalBerat += piece.berat || 0;
        }

        await this.orderModel.update({
            total_berat: totalBerat,
            total_koli: totalKoli,
            updated_at: new Date(),
        }, {
            where: { id: orderId },
            transaction
        });
    }

    private async createUpdateHistory(orderId: number, userId: number, updatedFields: string[], transaction: Transaction): Promise<void> {
        const remark = `Order details updated: ${updatedFields.join(', ')}`;

        await this.orderHistoryModel.create({
            order_id: orderId,
            status: 'Order Details Updated',
            remark: remark,
            created_by: userId,
        }, { transaction });
    }

    /**
     * Update order status based on pieces status
     * This method should be called whenever piece statuses change
     */
    private async updateOrderStatusFromPieces(orderId: number, transaction: Transaction): Promise<void> {
        const pieces = await this.orderPieceModel.findAll({
            where: { order_id: orderId },
            transaction
        });

        const newStatus = getOrderStatusFromPieces(pieces);

        await this.orderModel.update({
            status: newStatus,
            updated_at: new Date()
        }, {
            where: { id: orderId },
            transaction
        });
    }

    async deleteOrder(noResi: string, body: any) {
        const { user_id } = body;

        this.logger.log(`Starting delete order process for no_resi: ${noResi}, user_id: ${user_id}`);

        try {
            // 1. Validasi user dan otorisasi
            const user = await this.userModel.findByPk(user_id);
            if (!user) {
                this.logger.error(`User not found: ${user_id}`);
                throw new Error('User tidak ditemukan');
            }

            // // 2. Validasi level user (hanya admin yang boleh menghapus)
            // const userLevel = user.getDataValue('level');
            // if (userLevel !== 1) { // Assuming level 1 is admin
            //     this.logger.error(`User ${user_id} with level ${userLevel} is not authorized to delete orders`);
            //     throw new Error('Anda tidak memiliki izin untuk menghapus order. Hanya admin yang dapat melakukan operasi ini.');
            // }

            // 3. Cari order berdasarkan no_resi
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi }
            });
            if (!order) {
                this.logger.error(`Order not found: ${noResi}`);
                throw new Error('Order tidak ditemukan');
            }

            const orderId = order.getDataValue('id');
            const currentStatus = order.getDataValue('status');

            this.logger.log(`Found order: ${orderId} with status: ${currentStatus}`);

            // 4. Validasi status order (hanya Draft atau Cancelled yang boleh dihapus)
            if (currentStatus !== 'Draft' && currentStatus !== 'Cancelled' && currentStatus !== 'draft' && currentStatus !== 'cancelled') {
                this.logger.warn(`Order ${orderId} cannot be deleted - current status: ${currentStatus}`);
                throw new Error(`Order tidak bisa dihapus karena status saat ini adalah '${currentStatus}'. Hanya order dengan status 'Draft' atau 'Cancelled' yang dapat dihapus.`);
            }

            const deletedTables: string[] = [];
            const deletedRecordsCount: any = {
                order_pieces: 0,
                order_shipments: 0,
                order_invoices: 0,
                request_cancel: 0,
                order_delivery_notes: 0,
                order_histories: 0
            };

            // 5. Catat riwayat sebelum menghapus
            await this.addOrderHistory(orderId, {
                status: 'Order Deleted',
                remark: `Order dihapus oleh ${user.getDataValue('name')} (ID: ${user_id}) pada ${new Date().toISOString()}`,
                created_by: user_id
            } as any);

            // 6. Hapus data dari tabel anak secara berurutan

            // 6.1. Hapus order_pieces
            const deletedPieces = await this.orderPieceModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.order_pieces = deletedPieces;
            if (deletedPieces > 0) {
                deletedTables.push('order_pieces');
                this.logger.log(`Deleted ${deletedPieces} order_pieces for order ${orderId}`);
            }

            // 6.2. Hapus order_shipments
            const deletedShipments = await this.orderShipmentModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.order_shipments = deletedShipments;
            if (deletedShipments > 0) {
                deletedTables.push('order_shipments');
                this.logger.log(`Deleted ${deletedShipments} order_shipments for order ${orderId}`);
            }

            // 6.3. Hapus order_invoices dan order_invoice_details
            if (this.orderModel.sequelize?.models.OrderInvoice) {
                const orderInvoices = await this.orderModel.sequelize.models.OrderInvoice.findAll({
                    where: { order_id: orderId }
                });

                if (orderInvoices && orderInvoices.length > 0) {
                    for (const invoice of orderInvoices) {
                        // Hapus order_invoice_details terlebih dahulu
                        if (this.orderModel.sequelize?.models.OrderInvoiceDetail) {
                            const deletedInvoiceDetails = await this.orderModel.sequelize.models.OrderInvoiceDetail.destroy({
                                where: { invoice_id: invoice.getDataValue('id') }
                            });

                            if (deletedInvoiceDetails && deletedInvoiceDetails > 0) {
                                this.logger.log(`Deleted ${deletedInvoiceDetails} order_invoice_details for invoice ${invoice.getDataValue('id')}`);
                            }
                        }
                    }

                    // Hapus order_invoices
                    const deletedInvoices = await this.orderModel.sequelize.models.OrderInvoice.destroy({
                        where: { order_id: orderId }
                    });
                    deletedRecordsCount.order_invoices = deletedInvoices || 0;
                    if (deletedInvoices && deletedInvoices > 0) {
                        deletedTables.push('order_invoices');
                        this.logger.log(`Deleted ${deletedInvoices} order_invoices for order ${orderId}`);
                    }
                }
            }

            // 6.4. Hapus request_cancel
            const deletedRequestCancel = await this.requestCancelModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.request_cancel = deletedRequestCancel;
            if (deletedRequestCancel > 0) {
                deletedTables.push('request_cancel');
                this.logger.log(`Deleted ${deletedRequestCancel} request_cancel for order ${orderId}`);
            }

            // 6.5. Hapus order_delivery_notes
            if (this.orderModel.sequelize?.models.OrderDeliveryNote) {
                const deletedDeliveryNotes = await this.orderModel.sequelize.models.OrderDeliveryNote.destroy({
                    where: { no_tracking: noResi }
                });
                deletedRecordsCount.order_delivery_notes = deletedDeliveryNotes || 0;
                if (deletedDeliveryNotes && deletedDeliveryNotes > 0) {
                    deletedTables.push('order_delivery_notes');
                    this.logger.log(`Deleted ${deletedDeliveryNotes} order_delivery_notes for order ${orderId}`);
                }
            }

            // 6.6. Hapus order_histories (setelah mencatat riwayat penghapusan)
            const deletedHistories = await this.orderHistoryModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.order_histories = deletedHistories;
            if (deletedHistories > 0) {
                deletedTables.push('order_histories');
                this.logger.log(`Deleted ${deletedHistories} order_histories for order ${orderId}`);
            }

            // 7. Terakhir, hapus order
            await order.destroy();
            deletedTables.push('orders');
            this.logger.log(`Deleted order ${orderId}`);

            this.logger.log(`Order ${orderId} successfully deleted by user ${user_id}`);

            return {
                message: 'Order berhasil dihapus',
                success: true,
                data: {
                    order_id: orderId,
                    no_resi: noResi,
                    deleted_by: user.getDataValue('name'),
                    deleted_at: new Date().toISOString(),
                    deleted_tables: deletedTables,
                    deleted_records_count: deletedRecordsCount
                }
            };

        } catch (error) {
            this.logger.error(`Error in deleteOrder: ${error.message}`, error.stack);
            throw new Error(`Error deleting order: ${error.message}`);
        }
    }
} 