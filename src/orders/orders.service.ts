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
                        nama_barang: piece.nama_barang,
                        qty: piece.qty,
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