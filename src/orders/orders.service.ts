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
                nama_pengirim: createOrderDto.nama_pengirim,
                alamat_pengirim: createOrderDto.alamat_pengirim,
                provinsi_pengirim: createOrderDto.provinsi_pengirim,
                kota_pengirim: createOrderDto.kota_pengirim,
                kecamatan_pengirim: createOrderDto.kecamatan_pengirim,
                kelurahan_pengirim: createOrderDto.kelurahan_pengirim,
                kodepos_pengirim: createOrderDto.kodepos_pengirim,
                no_telepon_pengirim: createOrderDto.no_telepon_pengirim,
                nama_penerima: createOrderDto.nama_penerima,
                alamat_penerima: createOrderDto.alamat_penerima,
                provinsi_penerima: createOrderDto.provinsi_penerima,
                kota_penerima: createOrderDto.kota_penerima,
                kecamatan_penerima: createOrderDto.kecamatan_penerima,
                kelurahan_penerima: createOrderDto.kelurahan_penerima,
                kodepos_penerima: createOrderDto.kodepos_penerima,
                no_telepon_penerima: createOrderDto.no_telepon_penerima,
                layanan: createOrderDto.layanan,
                asuransi: createOrderDto.asuransi ? 1 : 0,
                harga_barang: createOrderDto.harga_barang || 0,
                status: 'Order Created',
                created_by: userId,
                order_by: userId,
            }, { transaction });

            // 2. Simpan ke tabel order_shipments
            const shipment = await this.orderShipmentModel.create({
                order_id: order.id,
                total_koli: shipmentData.totalKoli,
                total_berat: shipmentData.totalBerat,
                total_volume: shipmentData.totalVolume,
                berat_volume: shipmentData.beratVolume,
                qty: shipmentData.totalKoli,
                berat: shipmentData.totalBerat,
                panjang: shipmentData.totalPanjang,
                lebar: shipmentData.totalLebar,
                tinggi: shipmentData.totalTinggi,
                created_by: userId,
            }, { transaction });

            // 3. Simpan ke tabel order_pieces
            let pieceCounter = 1;
            const pieces = await Promise.all(
                createOrderDto.pieces.map(piece => {
                    const pieceId = `P${order.id}-${pieceCounter++}`;
                    return this.orderPieceModel.create({
                        order_id: order.id,
                        order_shipment_id: shipment.id,
                        piece_id: pieceId,
                        berat: piece.berat,
                        panjang: piece.panjang,
                        lebar: piece.lebar,
                        tinggi: piece.tinggi,
                        volume: this.calculateVolume(piece.panjang, piece.lebar, piece.tinggi),
                        berat_volume: this.calculateBeratVolume(piece.panjang, piece.lebar, piece.tinggi),
                        created_by: userId,
                    }, { transaction });
                })
            );

            // 4. Simpan ke tabel order_histories
            await this.orderHistoryModel.create({
                order_id: order.id,
                status: 'Order Created',
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
                status: 'Order Created',
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
            throw new InternalServerErrorException('Gagal generate PDF');
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
                [fn('SUM', literal(`CASE WHEN status = 'On Going' THEN 1 ELSE 0 END`)), 'on_going'],
                [fn('SUM', literal(`CASE WHEN status = 'On Delivery' THEN 1 ELSE 0 END`)), 'on_delivery'],
                [fn('SUM', literal(`CASE WHEN status = 'Completed' THEN 1 ELSE 0 END`)), 'completed'],
                [fn('SUM', literal(`CASE WHEN status = 'Canceled' THEN 1 ELSE 0 END`)), 'canceled'],
                [fn('SUM', literal(`CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END`)), 'payment_completed'],
                [fn('SUM', literal(`CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END`)), 'payment_pending'],
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
            raw: true,
            nest: true,
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan atau tidak memiliki akses');
        }

        // Transform data untuk response reorder
        const reorderData = {
            nama_pengirim: order.nama_pengirim,
            alamat_pengirim: order.alamat_pengirim,
            provinsi_pengirim: order.provinsi_pengirim,
            kota_pengirim: order.kota_pengirim,
            kecamatan_pengirim: order.kecamatan_pengirim,
            kelurahan_pengirim: order.kelurahan_pengirim,
            kodepos_pengirim: order.kodepos_pengirim,
            no_telepon_pengirim: order.no_telepon_pengirim,
            email_pengirim: order.email_pengirim,

            nama_penerima: order.nama_penerima,
            alamat_penerima: order.alamat_penerima,
            provinsi_penerima: order.provinsi_penerima,
            kota_penerima: order.kota_penerima,
            kecamatan_penerima: order.kecamatan_penerima,
            kelurahan_penerima: order.kelurahan_penerima,
            kodepos_penerima: order.kodepos_penerima,
            no_telepon_penerima: order.no_telepon_penerima,
            email_penerima: order.email_penerima,

            layanan: order.layanan,
            asuransi: order.asuransi === 1,
            harga_barang: order.harga_barang,
            nama_barang: order.nama_barang,

            pieces: (order as any).pieces?.map(piece => ({
                qty: piece.qty,
                berat: piece.berat,
                panjang: piece.panjang,
                lebar: piece.lebar,
                tinggi: piece.tinggi,
            })) || [],
        };

        return {
            message: 'Data reorder berhasil diambil',
            data: reorderData,
        };
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