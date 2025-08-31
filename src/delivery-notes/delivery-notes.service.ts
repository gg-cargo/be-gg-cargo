import { BadRequestException, Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderDeliveryNote } from '../models/order-delivery-note.model';
import { Hub } from '../models/hub.model';
import { TruckList } from '../models/truck-list.model';
import { JobAssign } from '../models/job-assign.model';
import { CreateDeliveryNoteDto, CreateDeliveryNoteResponseDto } from './dto/create-delivery-note.dto';
import { generateDeliveryNotePDF } from './helpers/generate-delivery-note-pdf.helper';
import { User } from '../models/user.model';
import { ListDeliveryNotesQueryDto, ListDeliveryNotesResponseDto } from './dto/list-delivery-notes.dto';
import { DeliveryNoteDetailResponseDto } from './dto/delivery-note-detail.dto';
import { ORDER_STATUS } from 'src/common/constants/order-status.constants';
import { OrderHistory } from '../models/order-history.model';
import { getOrderHistoryDateTime } from '../common/utils/date.utils';
import { OrderManifestInbound } from '../models/order-manifest-inbound.model';
import { InboundScanDto, InboundScanResponseDto } from './dto/inbound-scan.dto';
import { InboundConfirmWebDto, InboundConfirmWebResponseDto } from './dto/inbound-confirm-web.dto';

@Injectable()
export class DeliveryNotesService {
    private readonly logger = new Logger(DeliveryNotesService.name);

    constructor(
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderPiece) private readonly orderPieceModel: typeof OrderPiece,
        @InjectModel(OrderDeliveryNote) private readonly orderDeliveryNoteModel: typeof OrderDeliveryNote,
        @InjectModel(Hub) private readonly hubModel: typeof Hub,
        @InjectModel(TruckList) private readonly truckListModel: typeof TruckList,
        @InjectModel(JobAssign) private readonly jobAssignModel: typeof JobAssign,
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(OrderHistory) private readonly orderHistoryModel: typeof OrderHistory,
        @InjectModel(OrderManifestInbound) private readonly orderManifestInboundModel: typeof OrderManifestInbound,
    ) { }

    private generateDeliveryNoteNumber(date: Date, hubKode: string, seq: number): string {
        const yyyy = date.getFullYear();
        const mon = date.toLocaleString('en-US', { month: 'short' });
        const dd = String(date.getDate()).padStart(2, '0');
        const seqStr = String(seq).padStart(3, '0');
        return `${yyyy}${mon}${dd}${hubKode}${seqStr}`;
    }

    async createDeliveryNote(dto: CreateDeliveryNoteDto, createdByUserId: number): Promise<CreateDeliveryNoteResponseDto> {
        if (!dto.resi_list || dto.resi_list.length === 0) {
            throw new BadRequestException('resi_list tidak boleh kosong');
        }

        // Validasi hubs
        const [hubAsal, hubTujuan, hubTransit] = await Promise.all([
            this.hubModel.findByPk(dto.hub_asal_id),
            this.hubModel.findByPk(dto.hub_tujuan_id),
            dto.hub_transit_id ? this.hubModel.findByPk(dto.hub_transit_id) : Promise.resolve(null),
        ]);
        if (!hubAsal) throw new NotFoundException('Hub asal tidak ditemukan');
        if (!hubTujuan) throw new NotFoundException('Hub tujuan tidak ditemukan');
        if (dto.hub_transit_id && !hubTransit) throw new NotFoundException('Hub transit tidak ditemukan');

        // Validasi kendaraan
        const vehicle = await this.truckListModel.findOne({ where: { no_polisi: dto.no_polisi } });
        if (!vehicle) throw new NotFoundException('Kendaraan dengan no_polisi tersebut tidak ditemukan');

        // Validasi transporter_id & ambil nama_transporter
        const transporter = await this.userModel.findByPk(dto.transporter_id, { attributes: ['id', 'name', 'level'], raw: true });
        if (!transporter) {
            throw new NotFoundException('Transporter tidak ditemukan');
        }
        if (Number((transporter as any).level) !== 4) {
            throw new BadRequestException('User yang dipilih bukan transporter (level 4)');
        }

        // Ambil orders berdasarkan resi_list
        const orders = await this.orderModel.findAll({
            where: { no_tracking: { [Op.in]: dto.resi_list } },
            attributes: ['id', 'no_tracking', 'status', 'reweight_status', 'hub_dest_id'],
            raw: true,
        });
        if (orders.length !== dto.resi_list.length) {
            throw new BadRequestException('Terdapat nomor resi yang tidak valid');
        }

        // Validasi hanya order dengan statusOps "Menunggu pengiriman"
        // Definisi: reweight_status = 1 dan status bukan 'In Transit' atau 'Delivered'
        const invalidOrders = orders.filter(
            (o: any) => Number(o.reweight_status) !== 1 || o.status === 'In Transit' || o.status === 'Delivered'
        );
        if (invalidOrders.length > 0) {
            const invalidResi = invalidOrders.map((o: any) => o.no_tracking).join(', ');
            throw new BadRequestException(
                `Hanya order dengan statusOps Menunggu pengiriman yang diperbolehkan. Resi tidak valid: ${invalidResi}`
            );
        }

        // Ambil detail pengirim/penerima dari order pertama sebagai header nota
        const firstOrder = await this.orderModel.findOne({
            where: { no_tracking: dto.resi_list[0] },
            attributes: [
                'nama_pengirim', 'alamat_pengirim', 'no_telepon_pengirim',
                'nama_penerima', 'alamat_penerima', 'no_telepon_penerima'
            ],
            raw: true,
        });

        // Generate nomor nota kirim
        const hubKode = hubTujuan.getDataValue('kode');
        const today = new Date();
        // Dapatkan sequence dengan menghitung jumlah nota di hari ini dan hub tujuan
        const seq = await this.orderDeliveryNoteModel.count({
            where: {
                hub_id: hubTujuan.getDataValue('id'),
                created_at: { [Op.gte]: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
            },
        });
        const noDeliveryNote = this.generateDeliveryNoteNumber(today, hubKode, seq + 1);

        // Buat record delivery note
        // Validasi dan simpan no_seal (maks 3)
        let sealString: string | null = null;
        if (dto.no_seal && Array.isArray(dto.no_seal)) {
            if (dto.no_seal.length > 3) {
                throw new BadRequestException('Maksimal 3 nomor seal');
            }
            const cleaned = dto.no_seal.map((s) => String(s).trim()).filter(Boolean);
            sealString = cleaned.join(',');
        }

        await this.orderDeliveryNoteModel.create({
            no_delivery_note: noDeliveryNote,
            no_tracking: dto.resi_list.join(','),
            tanggal: today,
            nama_pengirim: (firstOrder as any)?.nama_pengirim || null,
            alamat_pengirim: (firstOrder as any)?.alamat_pengirim || null,
            no_telp_pengirim: (firstOrder as any)?.no_telepon_pengirim || null,
            nama_penerima: (firstOrder as any)?.nama_penerima || null,
            alamat_penerima: (firstOrder as any)?.alamat_penerima || null,
            no_telp_penerima: (firstOrder as any)?.no_telepon_penerima || null,
            transporter_id: dto.transporter_id,
            nama_transporter: transporter?.name || '',
            jenis_kendaraan: dto.jenis_kendaraan || vehicle.jenis_mobil || '',
            no_polisi: dto.no_polisi,
            no_seal: sealString,
            hub_id: hubTujuan.getDataValue('id'),
            agent_id: hubAsal.getDataValue('id'),
            status: 0,
            hub_bypass: hubTransit ? String(hubTransit.id) : null,
            created_by: createdByUserId,
            type: 'HUB',
            created_at: new Date(),
        });

        // Update orders dan pieces - cek status berdasarkan hub_dest_id vs next_hub
        const orderIds = orders.map((o) => o.id);
        const nextHubId = dto.hub_transit_id ?? dto.hub_tujuan_id;

        // Update setiap order dengan status yang sesuai
        for (const order of orders) {
            const orderHubDestId = Number(order.hub_dest_id);
            const isFinalDestination = orderHubDestId === nextHubId;

            const updateData = {
                assign_sj: noDeliveryNote,
                transporter_id: String(dto.transporter_id),
                truck_id: dto.no_polisi,
                status: isFinalDestination ? ORDER_STATUS.OUT_FOR_DELIVERY : ORDER_STATUS.IN_TRANSIT,
                current_hub: String(dto.hub_asal_id),
                next_hub: String(nextHubId),
            };

            await this.orderModel.update(updateData, { where: { id: order.id } });
        }

        await this.orderPieceModel.update(
            { delivery_note_id: 1 }, // placeholder linkage if needed elsewhere
            { where: { order_id: { [Op.in]: orderIds } } }
        );

        // Buat job_assigns
        await this.jobAssignModel.create({
            no_polisi: dto.no_polisi,
            number: noDeliveryNote,
            distance: '0',
            status: 0,
            remark: null,
            waypoints: null,
            konfirmasi_at: null,
            completed_at: null,
            completed_day: null,
            created_at: new Date(),
        } as any);

        // Update status truck menjadi digunakan
        await this.truckListModel.update({ status: 1 }, { where: { id: vehicle.id } });

        // Insert order_histories untuk setiap order
        const { date, time } = getOrderHistoryDateTime();
        for (const order of orders) {
            await this.orderHistoryModel.create({
                order_id: order.id,
                status: 'Delivery Note Created',
                remark: `Pesanan berangkat ke ${hubTujuan.getDataValue('nama')}`,
                date: date,
                time: time,
                created_by: createdByUserId,
                created_at: new Date(),
                provinsi: '', // akan diisi dari order jika diperlukan
                kota: ''     // akan diisi dari order jika diperlukan
            });
        }

        return {
            status: 'success',
            no_delivery_note: noDeliveryNote,
            order_ids: orderIds,
        };
    }

    async generatePdf(noDeliveryNote: string): Promise<{ status: string; link: string }> {
        const note = await this.orderDeliveryNoteModel.findOne({ where: { no_delivery_note: noDeliveryNote }, raw: true });
        if (!note) throw new NotFoundException('Delivery note tidak ditemukan');

        // Ambil hub asal (agent_id) dan hub tujuan (hub_id)
        const [fromHub, toHub] = await Promise.all([
            this.hubModel.findByPk(note.agent_id, { attributes: ['nama', 'alamat'], raw: true }),
            this.hubModel.findByPk(note.hub_id, { attributes: ['nama', 'alamat'], raw: true }),
        ]);

        // Ambil daftar resi
        const resiList = (note.no_tracking || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        if (resiList.length === 0) {
            throw new BadRequestException('Delivery note tidak memiliki daftar resi');
        }

        // Summary: qty & total berat
        const orders = await this.orderModel.findAll({
            where: { no_tracking: { [Op.in]: resiList } },
            attributes: ['id', 'no_tracking', 'nama_pengirim', 'nama_penerima', 'total_berat', 'hub_source_id', 'hub_dest_id'],
            raw: true,
        });

        const qty = orders.length;
        const berat_total = orders.reduce((acc, o) => acc + (Number(o.total_berat) || 0), 0);

        // Lampiran per order: jumlah_koli & berat_barang (sum dari pieces)
        const orderIds = orders.map(o => o.id);
        const pieceAgg = await this.orderPieceModel.findAll({
            where: { order_id: { [Op.in]: orderIds } },
            attributes: [
                'order_id',
                [fn('COUNT', col('id')), 'jumlah_koli'],
                [fn('SUM', col('berat')), 'berat_barang'],
            ],
            group: ['order_id'],
            raw: true,
        });
        // Kumpulkan semua piece_id untuk barcode/QR
        const allPieces = await this.orderPieceModel.findAll({
            where: { order_id: { [Op.in]: orderIds } },
            attributes: ['piece_id'],
            raw: true,
        });
        const pieceIds: string[] = (allPieces as any[]).map(p => String(p.piece_id)).filter(Boolean);
        const aggMap = new Map<number, { jumlah_koli: number; berat_barang: number }>();
        for (const row of pieceAgg as any[]) {
            aggMap.set(Number(row.order_id), {
                jumlah_koli: Number(row.jumlah_koli) || 0,
                berat_barang: Number(row.berat_barang) || 0,
            });
        }

        // Ambil nama hub asal/tujuan per order
        const hubIdSet = new Set<number>();
        orders.forEach((o: any) => {
            if (o.hub_source_id) hubIdSet.add(Number(o.hub_source_id));
            if (o.hub_dest_id) hubIdSet.add(Number(o.hub_dest_id));
        });
        const hubList = hubIdSet.size > 0
            ? await this.hubModel.findAll({ where: { id: { [Op.in]: Array.from(hubIdSet) } }, attributes: ['id', 'nama'], raw: true })
            : [];
        const hubNameMap = new Map<number, string>();
        (hubList as any[]).forEach(h => hubNameMap.set(Number(h.id), h.nama));

        const ordersPayload = orders.map((o: any) => ({
            no_tracking: o.no_tracking,
            nama_pengirim: o.nama_pengirim,
            nama_penerima: o.nama_penerima,
            jumlah_koli: aggMap.get(o.id)?.jumlah_koli ?? 0,
            berat_barang: aggMap.get(o.id)?.berat_barang ?? 0,
            asal: hubNameMap.get(Number(o.hub_source_id)) || null,
            tujuan: hubNameMap.get(Number(o.hub_dest_id)) || null,
        }));

        // Pecah no_seal untuk PDF
        const sealArr = (note as any).no_seal ? String((note as any).no_seal).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;

        const link = await generateDeliveryNotePDF({
            no_delivery_note: note.no_delivery_note,
            from_hub: fromHub ? { nama: fromHub.nama, alamat: fromHub.alamat } : null,
            to_hub: toHub ? { nama: toHub.nama, alamat: toHub.alamat } : null,
            transporter: {
                nama: note.nama_transporter || '-',
                jenis_kendaraan: note.jenis_kendaraan || '-',
                no_polisi: note.no_polisi || '-',
            },
            summary: { qty, berat_total },
            orders: ordersPayload,
            nama_transporter: note.nama_transporter,
            piece_ids: pieceIds,
            // @ts-ignore - properti opsional untuk helper
            no_seal: sealArr,
        });

        return { status: 'success', link };
    }

    async listDeliveryNotes(query: ListDeliveryNotesQueryDto, userId: number): Promise<ListDeliveryNotesResponseDto> {
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.max(1, Math.min(200, Number(query.limit || 20)));
        const offset = (page - 1) * limit;

        // Ambil hub_id dari user yang sedang login
        const user = await this.userModel.findByPk(userId, {
            attributes: ['hub_id', 'service_center_id']
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const userHubId = user.getDataValue('hub_id');
        const userServiceCenterId = user.getDataValue('service_center_id');

        if (!userHubId && !userServiceCenterId) {
            throw new BadRequestException('User tidak memiliki akses ke area operasional');
        }

        const where: any = {};

        // Filter berdasarkan hub asal user yang sedang login
        if (userHubId) {
            where.agent_id = userHubId;
        } else if (userServiceCenterId) {
            where.agent_id = userServiceCenterId;
        }

        if (query.search) {
            where[Op.or] = [
                { no_delivery_note: { [Op.like]: `%${query.search}%` } },
            ];
        }
        if (query.transporter_id) {
            where.transporter_id = query.transporter_id;
        }
        if (query.tanggal) {
            where.tanggal = query.tanggal;
        }

        const { rows, count } = await this.orderDeliveryNoteModel.findAndCountAll({
            where,
            offset,
            limit,
            order: [['created_at', 'DESC']],
            raw: true,
        });

        const hubIds = Array.from(new Set([
            ...rows.map((r: any) => Number(r.agent_id)).filter(Boolean),
            ...rows.map((r: any) => Number(r.hub_id)).filter(Boolean),
        ]));
        const transporterIds = Array.from(new Set(rows.map((r: any) => Number(r.transporter_id)).filter(Boolean)));

        const [hubs, transporters] = await Promise.all([
            this.hubModel.findAll({ where: { id: { [Op.in]: hubIds } }, attributes: ['id', 'nama'], raw: true }),
            this.userModel.findAll({ where: { id: { [Op.in]: transporterIds } }, attributes: ['id', 'name'], raw: true }),
        ]);

        const hubMap = new Map<number, string>();
        hubs.forEach((h: any) => hubMap.set(Number(h.id), h.nama));
        const transporterMap = new Map<number, string>();
        transporters.forEach((u: any) => transporterMap.set(Number(u.id), u.name));

        const items = rows.map((r: any) => ({
            id: r.id,
            no_delivery_note: r.no_delivery_note,
            tanggal: r.tanggal ?? null,
            transporter_id: Number(r.transporter_id),
            nama_transporter: r.nama_transporter || transporterMap.get(Number(r.transporter_id)) || null,
            hub_asal: hubMap.get(Number(r.agent_id)) || null,
            hub_tujuan: hubMap.get(Number(r.hub_id)) || null,
            no_polisi: r.no_polisi || null,
            jenis_kendaraan: r.jenis_kendaraan || null,
            status: Number(r.status),
            created_at: (r.created_at as Date)?.toISOString?.() || String(r.created_at),
        }));

        return {
            pagination: {
                current_page: page,
                limit,
                total_items: count,
                total_pages: Math.ceil(count / limit),
            },
            items,
        };
    }

    async getDeliveryNoteDetail(idOrNo: string | number): Promise<DeliveryNoteDetailResponseDto> {
        // Cari delivery note berdasarkan ID atau no_delivery_note
        const whereClause = isNaN(Number(idOrNo))
            ? { no_delivery_note: idOrNo }
            : { id: Number(idOrNo) };

        const deliveryNote = await this.orderDeliveryNoteModel.findOne({
            where: whereClause,
            raw: true,
        });

        if (!deliveryNote) {
            throw new NotFoundException('Delivery note tidak ditemukan');
        }

        // Ambil data transporter
        const transporter = await this.userModel.findByPk(deliveryNote.transporter_id, {
            attributes: ['id', 'name'],
            raw: true,
        });

        // Ambil data kendaraan
        const vehicle = await this.truckListModel.findOne({
            where: { no_polisi: deliveryNote.no_polisi },
            attributes: ['id', 'jenis_mobil', 'type'],
            raw: true,
        });

        // Ambil data hub asal dan tujuan
        const [hubAsal, hubTujuan, hubTransit] = await Promise.all([
            this.hubModel.findByPk(deliveryNote.agent_id, {
                attributes: ['id', 'nama'],
                raw: true,
            }),
            this.hubModel.findByPk(deliveryNote.hub_id, {
                attributes: ['id', 'nama'],
                raw: true,
            }),
            deliveryNote.hub_bypass ? this.hubModel.findByPk(deliveryNote.hub_bypass, {
                attributes: ['id', 'nama'],
                raw: true,
            }) : Promise.resolve(null),
        ]);

        // Ambil daftar resi dan data order
        const resiList = (deliveryNote.no_tracking || '').split(',').map((s: string) => s.trim()).filter(Boolean);

        if (resiList.length === 0) {
            throw new BadRequestException('Delivery note tidak memiliki daftar resi');
        }

        // Ambil data order
        const orders = await this.orderModel.findAll({
            where: { no_tracking: { [Op.in]: resiList } },
            attributes: ['id', 'no_tracking', 'nama_pengirim', 'nama_penerima', 'total_berat'],
            raw: true,
        });

        // Ambil data pieces untuk setiap order
        const orderIds = orders.map(o => o.id);
        const pieceAgg = await this.orderPieceModel.findAll({
            where: { order_id: { [Op.in]: orderIds } },
            attributes: [
                'order_id',
                [fn('COUNT', col('id')), 'jumlah_koli'],
            ],
            group: ['order_id'],
            raw: true,
        });

        const pieceMap = new Map<number, number>();
        pieceAgg.forEach((row: any) => {
            pieceMap.set(Number(row.order_id), Number(row.jumlah_koli) || 0);
        });

        // Format orders list
        const ordersList = orders.map((order: any) => ({
            no_tracking: order.no_tracking,
            pengirim: order.nama_pengirim || '-',
            penerima: order.nama_penerima || '-',
            total_berat: `${order.total_berat || 0} kg`,
            jumlah_koli: pieceMap.get(order.id) || 0,
        }));

        return {
            status: 'success',
            delivery_note: {
                id: deliveryNote.id,
                no_delivery_note: deliveryNote.no_delivery_note,
                tanggal: deliveryNote.tanggal ? new Date(deliveryNote.tanggal).toISOString().split('T')[0] : null,
                transporter: {
                    id: Number(deliveryNote.transporter_id),
                    nama: deliveryNote.nama_transporter || transporter?.name || '-',
                    no_polisi: deliveryNote.no_polisi || '-',
                    jenis_kendaraan: deliveryNote.jenis_kendaraan || vehicle?.jenis_mobil || vehicle?.type || '-',
                },
                rute: {
                    asal: hubAsal ? {
                        id: hubAsal.id,
                        nama: hubAsal.nama,
                    } : { id: 0, nama: '-' },
                    tujuan: hubTujuan ? {
                        id: hubTujuan.id,
                        nama: hubTujuan.nama,
                    } : { id: 0, nama: '-' },
                    transit: hubTransit ? {
                        id: hubTransit.id,
                        nama: hubTransit.nama,
                    } : null,
                },
                orders_list: ordersList,
            },
        };
    }

    async updateDeliveryNote(idOrNo: string, dto: CreateDeliveryNoteDto, updatedByUserId: number): Promise<{ no_delivery_note: string; added: string[]; removed: string[] }> {
        // Autorisasi sederhana (contoh): pastikan user ada. Implementasi level/role bisa ditambahkan sesuai kebutuhan.
        if (!updatedByUserId) {
            throw new BadRequestException('User tidak valid');
        }

        const whereClause = isNaN(Number(idOrNo)) ? { no_delivery_note: idOrNo } : { id: Number(idOrNo) };
        const existing = await this.orderDeliveryNoteModel.findOne({ where: whereClause, raw: true });
        if (!existing) throw new NotFoundException('Delivery note tidak ditemukan');

        // Validasi referensi
        const [hubAsal, hubTujuan, hubTransit] = await Promise.all([
            this.hubModel.findByPk(dto.hub_asal_id),
            this.hubModel.findByPk(dto.hub_tujuan_id),
            dto.hub_transit_id ? this.hubModel.findByPk(dto.hub_transit_id) : Promise.resolve(null),
        ]);
        if (!hubAsal) throw new NotFoundException('Hub asal tidak ditemukan');
        if (!hubTujuan) throw new NotFoundException('Hub tujuan tidak ditemukan');
        if (dto.hub_transit_id && !hubTransit) throw new NotFoundException('Hub transit tidak ditemukan');

        const vehicle = await this.truckListModel.findOne({ where: { no_polisi: dto.no_polisi } });
        if (!vehicle) throw new NotFoundException('Kendaraan dengan no_polisi tersebut tidak ditemukan');

        const transporter = await this.userModel.findByPk(dto.transporter_id, { attributes: ['id', 'name', 'level'], raw: true });
        if (!transporter) throw new NotFoundException('Transporter tidak ditemukan');
        if (Number((transporter as any).level) !== 4) throw new BadRequestException('User yang dipilih bukan transporter (level 4)');

        // Hitung diff resi
        const oldResi = (existing.no_tracking || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        const newResi = (dto.resi_list || []).map((s: string) => s.trim()).filter(Boolean);
        const oldSet = new Set(oldResi);
        const newSet = new Set(newResi);

        const added = newResi.filter(r => !oldSet.has(r));
        const removed = oldResi.filter(r => !newSet.has(r));

        // Validasi dan proses no_seal
        let sealString: string | null = null;
        if (dto.no_seal && Array.isArray(dto.no_seal)) {
            if (dto.no_seal.length > 3) {
                throw new BadRequestException('Maksimal 3 nomor seal');
            }
            const cleaned = dto.no_seal.map((s) => String(s).trim()).filter(Boolean);
            sealString = cleaned.join(',');
        }

        // Update header delivery note
        await this.orderDeliveryNoteModel.update({
            no_tracking: newResi.join(','),
            transporter_id: dto.transporter_id,
            nama_transporter: (transporter as any).name || existing.nama_transporter,
            jenis_kendaraan: dto.jenis_kendaraan || vehicle.jenis_mobil || existing.jenis_kendaraan,
            no_polisi: dto.no_polisi,
            no_seal: sealString !== null ? sealString : (existing as any).no_seal,
            hub_id: hubTujuan.getDataValue('id'),
            agent_id: hubAsal.getDataValue('id'),
            hub_bypass: hubTransit ? String(hubTransit.id) : null,
        }, { where: { id: existing.id } });

        // Update status truck lama dan baru jika berganti
        if (existing.no_polisi && existing.no_polisi !== dto.no_polisi) {
            await this.truckListModel.update({ status: 0 }, { where: { no_polisi: existing.no_polisi } });
            await this.truckListModel.update({ status: 1 }, { where: { no_polisi: dto.no_polisi } });
        }

        // Ambil orders untuk operasi update
        const addedOrders = await this.orderModel.findAll({ where: { no_tracking: { [Op.in]: added } }, raw: true });
        const removedOrders = await this.orderModel.findAll({ where: { no_tracking: { [Op.in]: removed } }, raw: true });

        // Tambah orders baru ke nota
        if (addedOrders.length) {
            await this.orderModel.update({
                assign_sj: existing.no_delivery_note,
                status: ORDER_STATUS.IN_TRANSIT,
                transporter_id: dto.transporter_id,
                truck_id: vehicle.no_polisi,
                current_hub: String(dto.hub_asal_id),
                next_hub: String(dto.hub_transit_id ?? dto.hub_tujuan_id),
            }, { where: { id: { [Op.in]: addedOrders.map((o: any) => o.id) } } });
            // TODO: insert order_histories untuk masing-masing order (Order Added to Delivery Note)
        }

        // Lepas orders yang dihapus dari nota
        if (removedOrders.length) {
            await this.orderModel.update({
                assign_sj: null,
                status: ORDER_STATUS.OUT_FOR_DELIVERY,
                next_hub: null,
            }, { where: { id: { [Op.in]: removedOrders.map((o: any) => o.id) } } });
            // TODO: insert order_histories untuk masing-masing order (Order Removed from Delivery Note)
        }

        // Kembalikan ringkasan perubahan
        return {
            no_delivery_note: existing.no_delivery_note,
            added,
            removed,
        };
    }

    async inboundScan(noDeliveryNote: string, dto: InboundScanDto): Promise<InboundScanResponseDto> {
        // Validasi user yang melakukan inbound scan
        const inboundUser = await this.userModel.findByPk(dto.inbound_by_user_id, {
            attributes: ['id', 'name', 'level'],
            raw: true,
        });

        if (!inboundUser) {
            throw new NotFoundException('User yang melakukan inbound scan tidak ditemukan');
        }

        // Validasi delivery note
        const deliveryNote = await this.orderDeliveryNoteModel.findOne({
            where: { no_delivery_note: noDeliveryNote },
            raw: true,
        });

        if (!deliveryNote) {
            throw new NotFoundException('Delivery note tidak ditemukan');
        }

        // Validasi hub tujuan
        const destinationHub = await this.hubModel.findByPk(dto.destination_hub_id, {
            attributes: ['id', 'nama'],
            raw: true,
        });

        if (!destinationHub) {
            throw new NotFoundException('Hub tujuan tidak ditemukan');
        }

        // Validasi pieces yang di-scan
        const pieces = await this.orderPieceModel.findAll({
            where: { piece_id: { [Op.in]: dto.scanned_piece_ids } },
            include: [
                {
                    model: this.orderModel,
                    as: 'order',
                    attributes: ['id', 'no_tracking', 'status', 'current_hub', 'next_hub'],
                },
            ],
            raw: true,
            nest: true,
        });

        if (pieces.length !== dto.scanned_piece_ids.length) {
            const foundPieceIds = pieces.map(p => p.piece_id);
            const missingPieceIds = dto.scanned_piece_ids.filter(id => !foundPieceIds.includes(id));
            throw new BadRequestException(`Pieces tidak ditemukan: ${missingPieceIds.join(', ')}`);
        }

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const now = new Date();
            const piecesUpdated: { piece_id: string; status: 'success' | 'failed'; message: string; }[] = [];
            const ordersUpdated: { order_id: number; no_tracking: string; current_hub: number; }[] = [];
            let manifestRecordsCreated = 0;
            let historyRecordsCreated = 0;

            // Proses setiap piece yang di-scan
            for (const piece of pieces) {
                try {
                    // Update piece
                    await this.orderPieceModel.update(
                        {
                            inbound_status: 1,
                            hub_current_id: dto.destination_hub_id,
                            inbound_by: dto.inbound_by_user_id,
                            updatedAt: now,
                        },
                        {
                            where: { piece_id: piece.piece_id },
                            transaction,
                        }
                    );

                    // Update order
                    const order = piece.order as any;
                    await this.orderModel.update(
                        {
                            current_hub: String(dto.destination_hub_id),
                            issetManifest_inbound: 1,
                            updatedAt: now,
                        },
                        {
                            where: { id: order.id },
                            transaction,
                        }
                    );

                    // Buat order history
                    const { date, time } = getOrderHistoryDateTime();
                    await this.orderHistoryModel.create(
                        {
                            order_id: order.id,
                            status: 'Piece Inbound Scanned',
                            remark: `pesanan tiba di svc ${destinationHub.nama}`,
                            date: date,
                            time: time,
                            created_by: dto.inbound_by_user_id,
                            created_at: now,
                            provinsi: '',
                            kota: '',
                        },
                        { transaction }
                    );

                    // Buat manifest inbound record
                    await this.orderManifestInboundModel.create({
                        order_id: order.no_tracking,
                        svc_id: String(dto.destination_hub_id),
                        user_id: String(dto.inbound_by_user_id),
                        created_at: now,
                    } as any, { transaction });

                    piecesUpdated.push({
                        piece_id: piece.piece_id,
                        status: 'success',
                        message: 'Piece berhasil di-inbound',
                    });

                    ordersUpdated.push({
                        order_id: order.id,
                        no_tracking: order.no_tracking,
                        current_hub: dto.destination_hub_id,
                    });

                    manifestRecordsCreated++;
                    historyRecordsCreated++;

                } catch (error) {
                    piecesUpdated.push({
                        piece_id: piece.piece_id,
                        status: 'failed',
                        message: `Error: ${error.message}`,
                    });
                }
            }

            await transaction.commit();

            return {
                message: 'Inbound scan berhasil diproses',
                success: true,
                data: {
                    no_delivery_note: noDeliveryNote,
                    destination_hub_id: dto.destination_hub_id,
                    total_pieces_scanned: dto.scanned_piece_ids.length,
                    pieces_updated: piecesUpdated,
                    orders_updated: ordersUpdated,
                    manifest_records_created: manifestRecordsCreated,
                    history_records_created: historyRecordsCreated,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(`Error dalam inbound scan: ${error.message}`);
        }
    }

    async inboundConfirmWeb(noDeliveryNote: string, dto: InboundConfirmWebDto): Promise<InboundConfirmWebResponseDto> {
        // Validasi user yang melakukan inbound confirm
        const inboundUser = await this.userModel.findByPk(dto.inbound_by_user_id, {
            attributes: ['id', 'name', 'level'],
            raw: true,
        });

        if (!inboundUser) {
            throw new NotFoundException('User yang melakukan inbound confirm tidak ditemukan');
        }

        // Validasi delivery note
        const deliveryNote = await this.orderDeliveryNoteModel.findOne({
            where: { no_delivery_note: noDeliveryNote },
            raw: true,
        });

        if (!deliveryNote) {
            throw new NotFoundException('Delivery note tidak ditemukan');
        }

        // Validasi hub tujuan
        const destinationHub = await this.hubModel.findByPk(dto.destination_hub_id, {
            attributes: ['id', 'nama'],
            raw: true,
        });

        if (!destinationHub) {
            throw new NotFoundException('Hub tujuan tidak ditemukan');
        }

        // Validasi hub tujuan sesuai dengan delivery note
        if (Number(deliveryNote.hub_id) !== dto.destination_hub_id) {
            throw new BadRequestException('Hub tujuan tidak sesuai dengan delivery note');
        }

        // Mengidentifikasi semua order dan piece
        const noTrackingList = (deliveryNote.no_tracking || '').split(',').map(s => s.trim()).filter(Boolean);

        if (noTrackingList.length === 0) {
            throw new BadRequestException('Delivery note tidak memiliki resi yang valid');
        }

        // Ambil semua orders berdasarkan no_tracking
        const orders = await this.orderModel.findAll({
            where: { no_tracking: { [Op.in]: noTrackingList } },
            attributes: ['id', 'no_tracking', 'status', 'current_hub'],
            raw: true,
        });

        if (orders.length !== noTrackingList.length) {
            const foundTrackingNumbers = orders.map(o => o.no_tracking);
            const missingTrackingNumbers = noTrackingList.filter(tracking => !foundTrackingNumbers.includes(tracking));
            throw new BadRequestException(`Resi tidak ditemukan: ${missingTrackingNumbers.join(', ')}`);
        }

        // Ambil semua pieces berdasarkan order_id
        const orderIds = orders.map(o => o.id);
        const pieces = await this.orderPieceModel.findAll({
            where: { order_id: { [Op.in]: orderIds } },
            attributes: ['id', 'piece_id', 'order_id', 'inbound_status'],
            raw: true,
        });

        if (pieces.length === 0) {
            throw new BadRequestException('Tidak ada pieces yang ditemukan untuk orders ini');
        }

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const now = new Date();
            const piecesUpdated: { piece_id: string; status: 'success' | 'failed'; message: string; }[] = [];
            const ordersUpdated: { order_id: number; no_tracking: string; current_hub: number; }[] = [];
            let historyRecordsCreated = 0;

            // Update semua pieces secara massal
            const pieceUpdateResult = await this.orderPieceModel.update(
                {
                    inbound_status: 1,
                    hub_current_id: dto.destination_hub_id,
                    inbound_by: dto.inbound_by_user_id,
                    updatedAt: now,
                },
                {
                    where: { order_id: { [Op.in]: orderIds } },
                    transaction,
                }
            );

            // Update semua orders secara massal
            const orderUpdateResult = await this.orderModel.update(
                {
                    current_hub: String(dto.destination_hub_id),
                    issetManifest_inbound: 1,
                    updatedAt: now,
                },
                {
                    where: { id: { [Op.in]: orderIds } },
                    transaction,
                }
            );

            // Buat order history untuk setiap order
            const { date, time } = getOrderHistoryDateTime();
            for (const order of orders) {
                await this.orderHistoryModel.create(
                    {
                        order_id: order.id,
                        status: 'Inbound Manifest Confirmed (Manual)',
                        remark: `pesanan tiba di svc ${destinationHub.nama}`,
                        date: date,
                        time: time,
                        created_by: dto.inbound_by_user_id,
                        created_at: now,
                        provinsi: '',
                        kota: '',
                    },
                    { transaction }
                );
                historyRecordsCreated++;
            }

            // Prepare response data
            for (const piece of pieces) {
                piecesUpdated.push({
                    piece_id: piece.piece_id,
                    status: 'success',
                    message: 'Piece berhasil dikonfirmasi inbound',
                });
            }

            for (const order of orders) {
                ordersUpdated.push({
                    order_id: order.id,
                    no_tracking: order.no_tracking,
                    current_hub: dto.destination_hub_id,
                });
            }

            await transaction.commit();

            return {
                message: 'Inbound confirm web berhasil diproses',
                success: true,
                data: {
                    no_delivery_note: noDeliveryNote,
                    destination_hub_id: dto.destination_hub_id,
                    total_orders_confirmed: orders.length,
                    total_pieces_confirmed: pieces.length,
                    orders_updated: ordersUpdated,
                    pieces_updated: piecesUpdated,
                    history_records_created: historyRecordsCreated,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(`Error dalam inbound confirm web: ${error.message}`);
        }
    }
}
