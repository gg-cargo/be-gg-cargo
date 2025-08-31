import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { Hub } from '../models/hub.model';
import { ServiceCenter } from '../models/service-center.model';

@Injectable()
export class TrackingsService {
    constructor(
        @InjectModel(Order)
        private orderModel: typeof Order,
        @InjectModel(OrderPiece)
        private orderPieceModel: typeof OrderPiece,
        @InjectModel(OrderHistory)
        private orderHistoryModel: typeof OrderHistory,
        @InjectModel(Hub)
        private hubModel: typeof Hub,
        @InjectModel(ServiceCenter)
        private serviceCenterModel: typeof ServiceCenter,
    ) { }

    async getTrackingByResi(noResi: string) {
        // 1. Cari order berdasarkan no_tracking
        const order = await this.orderModel.findOne({
            where: { no_tracking: noResi },
            include: [
                {
                    model: this.orderPieceModel,
                    as: 'pieces',
                    attributes: [
                        'id', 'piece_id', 'berat', 'panjang', 'lebar', 'tinggi',
                        'pickup_status', 'deliver_status', 'outbound_status',
                        'inbound_status', 'hub_status', 'reweight_status'
                    ],
                },
            ],
        });

        if (!order) {
            throw new NotFoundException('Nomor resi tidak ditemukan');
        }

        // 2. Ambil riwayat perjalanan
        const histories = await this.orderHistoryModel.findAll({
            where: { order_id: order.getDataValue('id') },
            order: [['created_at', 'ASC']],
            raw: true,
        });

        // 3. Ambil informasi hub dan service center
        const hubSource = order.getDataValue('hub_source_id')
            ? await this.hubModel.findByPk(order.getDataValue('hub_source_id'), {
                attributes: ['nama'],
                raw: true,
            })
            : null;

        const hubDest = order.getDataValue('hub_dest_id')
            ? await this.hubModel.findByPk(order.getDataValue('hub_dest_id'), {
                attributes: ['nama'],
                raw: true,
            })
            : null;

        const svcSource = order.getDataValue('svc_source_id')
            ? await this.serviceCenterModel.findByPk(order.getDataValue('svc_source_id'), {
                attributes: ['nama'],
                raw: true,
            })
            : null;

        const svcDest = order.getDataValue('svc_dest_id')
            ? await this.serviceCenterModel.findByPk(order.getDataValue('svc_dest_id'), {
                attributes: ['nama'],
                raw: true,
            })
            : null;

        // 4. Format riwayat perjalanan
        const formattedHistories = histories.map((history: any) => ({
            tanggal: history.date,
            waktu: history.time,
            status: history.status,
            remark: history.remark,
            lokasi: `${history.kota}, ${history.provinsi}`,
            dilakukan_oleh: 'System', // Default value since no user association
            bukti: {
                foto_url: history.base64Foto ? `data:image/jpeg;base64,${history.base64Foto}` : null,
                tanda_tangan_url: history.base64SignCustomer ? `data:image/png;base64,${history.base64SignCustomer}` : null,
            },
            koordinat: history.latlng,
        }));

        // 5. Format detail pieces
        const formattedPieces = order.getDataValue('pieces')?.map((piece: any) => ({
            piece_id: piece.getDataValue('piece_id'),
            berat: piece.getDataValue('berat'),
            dimensi: `${piece.getDataValue('panjang')}x${piece.getDataValue('lebar')}x${piece.getDataValue('tinggi')}`,
            status_terkini_piece: this.getPieceStatus(piece),
        })) || [];

        // 6. Tentukan status terkini
        const statusTerkini = this.getCurrentStatus(formattedHistories, order);

        // 7. Cek apakah ada masalah
        const isProblem = this.checkForProblems(formattedHistories, order);

        return {
            message: 'Data berhasil diambil',
            data: {
                no_tracking: order.getDataValue('no_tracking'),
                status_terkini: statusTerkini,
                estimasi_pengiriman: order.getDataValue('est_delivery_date'),
                detail_order: {
                    nama_pengirim: order.getDataValue('nama_pengirim'),
                    alamat_pengirim: order.getDataValue('alamat_pengirim'),
                    nama_penerima: order.getDataValue('nama_penerima'),
                    alamat_penerima: order.getDataValue('alamat_penerima'),
                    layanan: order.getDataValue('layanan'),
                    total_berat: `${order.getDataValue('total_berat')} kg`,
                    hub_asal: hubSource?.nama || svcSource?.nama || 'N/A',
                    hub_tujuan: hubDest?.nama || svcDest?.nama || 'N/A',
                    total_harga: order.getDataValue('total_harga'),
                    asuransi: order.getDataValue('asuransi'),
                    packing: order.getDataValue('packing'),
                },
                histori_perjalanan: formattedHistories,
                detail_pieces: formattedPieces,
                status_masalah: {
                    is_problem: isProblem,
                    detail_kendala: isProblem ? this.getProblemDetails(formattedHistories, order) : null,
                },
            },
        };
    }

    private getPieceStatus(piece: any): string {
        if (piece.deliver_status === 1) return 'Delivered';
        if (piece.outbound_status === 1) return 'Outbound';
        if (piece.inbound_status === 1) return 'Inbound';
        if (piece.hub_status === 1) return 'At Hub';
        if (piece.pickup_status === 1) return 'Picked Up';
        return 'Pending';
    }

    private getCurrentStatus(histories: any[], order: any): string {
        if (histories.length === 0) return 'Order Created';

        const latestHistory = histories[0];

        // Mapping status ke bahasa yang lebih user-friendly
        const statusMapping: { [key: string]: string } = {
            'Order Created': 'Order Dibuat',
            'Pickup Completed': 'Barang Berhasil Di-pickup',
            'Pickup Failed': 'Pickup Gagal',
            'Piece Reweighted': 'Barang Ditimbang Ulang',
            'Added to Manifest': 'Dimasukkan ke Manifest',
            'Departed from Hub': 'Berangkat dari Hub',
            'Arrived at Hub': 'Tiba di Hub',
            'Outbound Scan': 'Barang Keluar dari Hub',
            'Inbound Scan': 'Barang Masuk ke Hub',
            'Delivery Started': 'Pengiriman Dimulai',
            'Delivery Completed': 'Barang Berhasil Dikirim',
            'Delivery Failed': 'Pengiriman Gagal',
        };

        return statusMapping[latestHistory.status] || latestHistory.status;
    }

    private checkForProblems(histories: any[], order: any): boolean {
        // Cek status pickup gagal
        const pickupFailed = histories.some(h => h.status === 'Pickup Failed');

        // Cek delivery gagal
        const deliveryFailed = histories.some(h => h.status === 'Delivery Failed');

        // Cek order dibatalkan
        const isCancelled = order.getDataValue('status') === 'Cancelled';

        // Cek is_gagal_pickup
        const isGagalPickup = order.getDataValue('is_gagal_pickup') === 1;

        return pickupFailed || deliveryFailed || isCancelled || isGagalPickup;
    }

    private getProblemDetails(histories: any[], order: any): string {
        const problems: string[] = [];

        if (order.getDataValue('is_gagal_pickup') === 1) {
            problems.push('Pickup gagal dilakukan');
        }

        const pickupFailed = histories.find(h => h.status === 'Pickup Failed');
        if (pickupFailed) {
            problems.push(`Pickup gagal: ${pickupFailed.remark}`);
        }

        const deliveryFailed = histories.find(h => h.status === 'Delivery Failed');
        if (deliveryFailed) {
            problems.push(`Pengiriman gagal: ${deliveryFailed.remark}`);
        }

        if (order.getDataValue('status') === 'Cancelled') {
            problems.push('Order dibatalkan');
        }

        return problems.join('; ');
    }
} 