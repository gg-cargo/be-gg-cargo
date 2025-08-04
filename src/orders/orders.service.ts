import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderList } from '../models/order-list.model';
import { OrderReferensi } from '../models/order-referensi.model';
import { CreateOrderDto, CreateOrderPieceDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { UpdateOrderDto, OrderPieceUpdateDto } from './dto/update-order.dto';
import { UpdateOrderResponseDto } from './dto/order-response.dto';
import { TrackingHelper } from './helpers/tracking.helper';
import { generateResiPDF } from './helpers/generate-resi-pdf.helper';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { ReweightPieceDto } from './dto/reweight-piece.dto';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { Op, fn, col, literal } from 'sequelize';
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class OrdersService {
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
    ) { }

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

                status: 'Menunggu diproses',
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
                status: 'Order diproses',
                keterangan: 'Order berhasil dibuat',
                provinsi: createOrderDto.provinsi_pengirim,
                kota: createOrderDto.kota_pengirim,
                remark: 'Order berhasil dibuat',
                created_by: userId,
            }, { transaction });

            // 5. Simpan ke tabel order_list
            // @ts-ignore
            await this.orderListModel.create({
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
                nama_penerima: createOrderDto.nama_penerima,
                alamat_penerima: createOrderDto.alamat_penerima,
                provinsi_penerima: createOrderDto.provinsi_penerima,
                kota_penerima: createOrderDto.kota_penerima,
                kecamatan_penerima: createOrderDto.kecamatan_penerima,
                kelurahan_penerima: createOrderDto.kelurahan_penerima,
                kodepos_penerima: createOrderDto.kodepos_penerima,
                no_telepon_penerima: createOrderDto.no_telepon_penerima,
                email_penerima: createOrderDto.email_penerima || '',
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
        return {
            message: 'Data order berhasil diambil',
            data: orders,
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

    async cancelOrder(orderId: number, userId: number) {
        const order = await this.orderModel.findOne({ where: { id: orderId, order_by: userId } });
        if (!order) throw new NotFoundException('Order tidak ditemukan atau tidak milik Anda');
        if (order.getDataValue('status') === 'dibatalkan') {
            return { message: 'Order sudah dibatalkan', data: { order_id: orderId, status: order.status } };
        }
        await this.orderModel.update(
            { status: 'dibatalkan' },
            { where: { id: orderId, order_by: userId } }
        );
        return { message: 'Order berhasil dibatalkan', data: { order_id: orderId, status: 'dibatalkan' } };
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

    async reweightPiece(pieceId: number, reweightDto: ReweightPieceDto) {
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
            const orderId = piece.getDataValue('order_id');
            const allPieces = await this.orderPieceModel.findAll({
                where: { order_id: orderId },
                attributes: ['reweight_status'],
                raw: true,
            });

            const allReweighted = allPieces.every(p => p.reweight_status === 1);

            // 3. Update order reweight status if all pieces are reweighted
            if (allReweighted) {
                await this.orderModel.update(
                    {
                        reweight_status: 1,
                        isUnreweight: 0,
                        remark_reweight: 'Semua pieces telah di-reweight',
                    },
                    {
                        where: { id: orderId },
                        transaction,
                    }
                );
            }

            // 4. Create order_histories
            const historyRemark = `Piece ID: ${pieceId}, Berat awal: ${oldBerat} kg → ${berat} kg, Dimensi awal: ${oldPanjang}x${oldLebar}x${oldTinggi} cm → ${panjang}x${lebar}x${tinggi} cm`;

            await this.orderHistoryModel.create(
                {
                    order_id: orderId,
                    status: 'Piece Reweighted',
                    remark: historyRemark,
                    provinsi: piece.getDataValue('order')?.getDataValue('provinsi_pengirim') || '',
                    kota: piece.getDataValue('order')?.getDataValue('kota_pengirim') || '',
                    date: now.toISOString().split('T')[0],
                    time: now.toTimeString().split(' ')[0],
                    created_by: reweight_by_user_id,
                },
                { transaction }
            );

            await transaction.commit();

            return {
                message: 'Piece berhasil di-reweight',
                success: true,
                data: {
                    piece_id: pieceId,
                    order_id: orderId,
                    old_measurements: {
                        berat: oldBerat,
                        panjang: oldPanjang,
                        lebar: oldLebar,
                        tinggi: oldTinggi,
                    },
                    new_measurements: {
                        berat,
                        panjang,
                        lebar,
                        tinggi,
                    },
                    reweight_by: reweight_by_user_id,
                    reweight_at: now,
                    order_completed_reweight: allReweighted,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    async estimatePrice(estimateDto: EstimatePriceDto) {
        const { origin, destination, item_details, service_options } = estimateDto;

        // Validasi layanan
        const validServices = ['Ekonomi', 'Reguler', 'Kirim Motor', 'Paket', 'Express', 'Sewa Truk'];
        if (!validServices.includes(service_options.layanan)) {
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

        // Hitung estimasi harga berdasarkan layanan
        let basePrice = 0;
        let estimatedDays = 0;
        let serviceDescription = '';

        switch (service_options.layanan) {
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

            case 'Kirim Motor':
                if (service_options.motor_type === '125cc') {
                    basePrice = 120000; // Rp120.000
                } else {
                    basePrice = 150000; // Rp150.000
                }
                estimatedDays = 5;
                serviceDescription = `Layanan kirim motor ${service_options.motor_type}`;
                break;

            case 'Paket':
                if (totalWeight <= 25) {
                    basePrice = 15000; // Rp15.000
                } else {
                    throw new BadRequestException('Berat melebihi batas maksimal 25kg untuk layanan Paket');
                }
                estimatedDays = 2;
                serviceDescription = 'Layanan paket dengan batas maksimal 25kg';
                break;

            case 'Express':
                // Estimasi jarak sederhana (bisa dikembangkan dengan API maps)
                const estimatedDistance = 10; // km
                basePrice = 10000 + (estimatedDistance * 3000); // Base + (jarak × Rp3.000/km)
                estimatedDays = 1;
                serviceDescription = 'Layanan express same day delivery';
                break;

            case 'Sewa Truk':
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
                break;

            default:
                throw new BadRequestException('Layanan tidak dikenali');
        }

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
            let orderPiecesUpdated = 0;

            // Update order details
            const orderUpdateData: any = {
                updated_at: new Date(),
            };

            // Check and update order fields
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
            if (updateOrderDto.nama_barang !== undefined) {
                orderUpdateData.nama_barang = updateOrderDto.nama_barang;
                updatedFields.push('nama_barang');
            }
            if (updateOrderDto.layanan !== undefined) {
                orderUpdateData.layanan = updateOrderDto.layanan;
                updatedFields.push('layanan');
            }
            if (updateOrderDto.status !== undefined) {
                orderUpdateData.status = updateOrderDto.status;
                updatedFields.push('status');
            }
            if (updateOrderDto.catatan !== undefined) {
                orderUpdateData.catatan = updateOrderDto.catatan;
                updatedFields.push('catatan');
            }

            // Update order if there are changes
            if (Object.keys(orderUpdateData).length > 1) { // More than just updated_at
                await this.orderModel.update(orderUpdateData, {
                    where: { id: order.id },
                    transaction
                });
            }

            // Update order pieces if provided
            if (updateOrderDto.order_pieces_update && updateOrderDto.order_pieces_update.length > 0) {
                for (const pieceUpdate of updateOrderDto.order_pieces_update) {
                    const piece = await this.orderPieceModel.findOne({
                        where: {
                            piece_id: pieceUpdate.piece_id,
                            order_id: order.id
                        }
                    });

                    if (!piece) {
                        throw new NotFoundException(`Order piece dengan ID ${pieceUpdate.piece_id} tidak ditemukan`);
                    }

                    const pieceUpdateData: any = {
                        updated_at: new Date(),
                    };

                    if (pieceUpdate.berat !== undefined) {
                        pieceUpdateData.berat = pieceUpdate.berat;
                        updatedFields.push(`piece_${pieceUpdate.piece_id}_berat`);
                    }
                    if (pieceUpdate.panjang !== undefined) {
                        pieceUpdateData.panjang = pieceUpdate.panjang;
                        updatedFields.push(`piece_${pieceUpdate.piece_id}_panjang`);
                    }
                    if (pieceUpdate.lebar !== undefined) {
                        pieceUpdateData.lebar = pieceUpdate.lebar;
                        updatedFields.push(`piece_${pieceUpdate.piece_id}_lebar`);
                    }
                    if (pieceUpdate.tinggi !== undefined) {
                        pieceUpdateData.tinggi = pieceUpdate.tinggi;
                        updatedFields.push(`piece_${pieceUpdate.piece_id}_tinggi`);
                    }
                    if (pieceUpdate.nama_barang !== undefined) {
                        pieceUpdateData.nama_barang = pieceUpdate.nama_barang;
                        updatedFields.push(`piece_${pieceUpdate.piece_id}_nama_barang`);
                    }

                    if (Object.keys(pieceUpdateData).length > 1) { // More than just updated_at
                        await this.orderPieceModel.update(pieceUpdateData, {
                            where: { id: piece.id },
                            transaction
                        });
                        orderPiecesUpdated++;
                    }
                }

                // Recalculate total weight if pieces were updated
                if (orderPiecesUpdated > 0 && (order.getDataValue('reweight_status') as any) === 0) {
                    await this.recalculateOrderTotals(order.id, transaction);
                }
            }

            // Audit trail removed - no longer creating order_histories entry

            await transaction.commit();

            return {
                message: 'Order berhasil diperbarui',
                success: true,
                data: {
                    no_resi: noResi,
                    updated_fields: updatedFields,
                    order_pieces_updated: orderPiecesUpdated > 0 ? orderPiecesUpdated : undefined,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private validateOrderUpdatePermission(order: Order): void {
        // Check if order can be updated based on current status
        const restrictedStatuses = ['Delivered', 'Cancelled'];

        if (restrictedStatuses.includes(order.status)) {
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
} 