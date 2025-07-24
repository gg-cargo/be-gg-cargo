import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderReferensi } from '../models/order-referensi.model';
import { CreateOrderDto, CreateOrderPieceDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { TrackingHelper } from './helpers/tracking.helper';
import { generateResiPDF } from './helpers/generate-resi-pdf.helper';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
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

                //surat jalan
                isSuratJalanBalik: createOrderDto.isSuratJalanBalik || "0",
                SJName: createOrderDto.SJName,
                SJPhone: createOrderDto.SJPhone,
                SJAddress: createOrderDto.SJAddress,
                SJLocation: createOrderDto.SJLocation,
                SJLatlng: createOrderDto.SJLatlng,
                surat_jalan_balik: createOrderDto.surat_jalan_balik,

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

        // 4. Hitung ringkasan koli
        let qty = 0, berat = 0, panjang = 0, lebar = 0, tinggi = 0, volume = 0;
        for (const s of shipments) {
            qty += s.qty;
            berat += s.berat;
            panjang += s.panjang;
            lebar += s.lebar;
            tinggi += s.tinggi;
            volume += (s.panjang * s.lebar * s.tinggi * s.qty) / 1000000;
        }
        const kubikasi = volume.toFixed(2);
        const beratVolume = (volume * 250).toFixed(2);

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
                jumlah_koli: qty,
                berat_aktual: berat,
                berat_volume: beratVolume,
                kubikasi: kubikasi,
            },
            ringkasan: {
                qty,
                berat,
                panjang,
                lebar,
                tinggi,
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
        let totalKoli = 0;
        let totalBerat = 0;
        let totalVolume = 0;
        let totalPanjang = 0;
        let totalLebar = 0;
        let totalTinggi = 0;

        pieces.forEach(piece => {
            totalKoli += piece.qty;
            totalBerat += piece.berat * piece.qty;
            const volume = this.calculateVolume(piece.panjang, piece.lebar, piece.tinggi);
            totalVolume += volume * piece.qty;
            totalPanjang += piece.panjang * piece.qty;
            totalLebar += piece.lebar * piece.qty;
            totalTinggi += piece.tinggi * piece.qty;
        });

        const beratVolume = totalVolume * 250;

        return {
            totalKoli,
            totalBerat,
            totalVolume,
            beratVolume,
            totalPanjang,
            totalLebar,
            totalTinggi,
        };
    }

    private calculateVolume(panjang: number, lebar: number, tinggi: number): number {
        return (panjang * lebar * tinggi) / 1000000; // Convert to meter kubik
    }

    private calculateBeratVolume(panjang: number, lebar: number, tinggi: number): number {
        const volume = this.calculateVolume(panjang, lebar, tinggi);
        return volume * 250;
    }
} 