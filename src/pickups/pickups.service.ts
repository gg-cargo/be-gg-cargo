import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderNotifikasi } from '../models/order-notifikasi.model';
import { OrderPiece } from '../models/order-piece.model';
import { RequestCancel } from '../models/request-cancel.model';
import { User } from '../models/user.model';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { ReschedulePickupDto } from './dto/reschedule-pickup.dto';
import { ConfirmPickupDto } from './dto/confirm-pickup.dto';
import { PickupSummaryDto } from './dto/pickup-summary.dto';

interface PickupQueueParams {
    page: number;
    limit: number;
    hub_id?: number;
    svc_source_id?: number;
    status_pickup?: string;
    priority?: boolean;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: string;
}

@Injectable()
export class PickupsService {
    constructor(
        @InjectModel(Order)
        private orderModel: typeof Order,
        @InjectModel(OrderShipment)
        private orderShipmentModel: typeof OrderShipment,
        @InjectModel(OrderPickupDriver)
        private orderPickupDriverModel: typeof OrderPickupDriver,
        @InjectModel(OrderHistory)
        private orderHistoryModel: typeof OrderHistory,
        @InjectModel(OrderNotifikasi)
        private orderNotifikasiModel: typeof OrderNotifikasi,
        @InjectModel(OrderPiece)
        private orderPieceModel: typeof OrderPiece,
        @InjectModel(RequestCancel)
        private requestCancelModel: typeof RequestCancel,
        @InjectModel(User)
        private userModel: typeof User,
    ) { }

    async getPickupQueue(params: PickupQueueParams) {
        const {
            page,
            limit,
            hub_id,
            svc_source_id,
            status_pickup,
            priority,
            search,
            date_from,
            date_to,
            sort_by,
            sort_order,
        } = params;

        // Build where condition
        const whereCondition: any = {};

        // Filter status pickup (default: pending/unassigned)
        if (status_pickup) {
            whereCondition.status_pickup = status_pickup;
        } else {
            whereCondition.status_pickup = {
                [Op.or]: ['Pending', 'Unassigned', null, '']
            };
        }

        // Filter berdasarkan hub atau service center
        if (hub_id) {
            whereCondition.hub_source_id = hub_id;
        }
        if (svc_source_id) {
            whereCondition.svc_source_id = svc_source_id;
        }

        // Filter berdasarkan tanggal
        if (date_from || date_to) {
            whereCondition.created_at = {};
            if (date_from) {
                whereCondition.created_at[Op.gte] = new Date(date_from);
            }
            if (date_to) {
                whereCondition.created_at[Op.lte] = new Date(date_to);
            }
        }

        // Filter search
        if (search) {
            whereCondition[Op.or] = [
                { no_tracking: { [Op.like]: `%${search}%` } },
                { nama_pengirim: { [Op.like]: `%${search}%` } },
                { nama_penerima: { [Op.like]: `%${search}%` } },
                { alamat_pengirim: { [Op.like]: `%${search}%` } },
            ];
        }

        // Filter priority (berdasarkan layanan)
        if (priority) {
            // Filter hanya layanan express (priority tinggi)
            const existingOr = whereCondition[Op.or] ?? [];
            whereCondition[Op.or] = [
                ...existingOr,
                { layanan: { [Op.like]: '%express%' } },
                { layanan: { [Op.like]: '%EXPRESS%' } },
                { layanan: { [Op.like]: '%Express%' } },
            ];
        }

        // Exclude failed pickups unless it's a re-attempt scenario
        whereCondition.is_gagal_pickup = {
            [Op.or]: [0, null]
        };

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build order clause
        const orderClause: any[] = [];
        if (sort_by === 'pickup_time') {
            orderClause.push(['pickup_time', sort_order]);
        } else if (sort_by === 'priority') {
            // Custom ordering for priority (express orders first, then regular)
            orderClause.push([
                this.orderModel.sequelize?.literal(`
          CASE 
            WHEN layanan LIKE '%express%' OR layanan LIKE '%EXPRESS%' OR layanan LIKE '%Express%' THEN 1
            WHEN layanan LIKE '%regular%' OR layanan LIKE '%REGULAR%' OR layanan LIKE '%Regular%' THEN 2
            ELSE 3
          END
        `) || 'created_at',
                'ASC'
            ]);
        } else {
            orderClause.push([sort_by || 'created_at', sort_order || 'DESC']);
        }

        // Execute query with join to order_shipments for calculating totals
        const { count, rows } = await this.orderModel.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: ['qty', 'berat'],
                    required: false,
                }
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'no_telepon_pengirim',
                'alamat_pengirim',
                'pickup_time',
                'status_pickup',
                'layanan',
                'created_at'
            ],
            order: orderClause,
            limit,
            offset,
            raw: true,
        });

        // Transform data untuk format tabel
        const transformedOrders = rows.map((order, index) => {
            // Hitung total koli dan berat dari shipments
            let totalKoli = 0;
            let totalBerat = 0;

            // Untuk data raw, shipments mungkin tidak terstruktur dengan baik
            // Coba akses langsung dari order jika ada
            if (order.shipments && Array.isArray(order.shipments)) {
                order.shipments.forEach((shipment: any) => {
                    totalKoli += shipment.qty || 0;
                    totalBerat += (shipment.berat || 0) * (shipment.qty || 0);
                });
            } else if (order['shipments.qty'] && order['shipments.berat']) {
                // Jika menggunakan raw query, data mungkin flat
                totalKoli = order['shipments.qty'] || 0;
                totalBerat = (order['shipments.berat'] || 0) * (order['shipments.qty'] || 0);
            }

            return {
                no: (page - 1) * limit + index + 1,
                no_resi: order.no_tracking,
                customer: {
                    nama: order.nama_pengirim,
                    telepon: order.no_telepon_pengirim
                },
                alamat_pickup: order.alamat_pengirim,
                berat: totalBerat > 0 ? `${totalBerat.toFixed(1)} kg` : '-',
                koli: totalKoli,
                tanggal_pickup: order.pickup_time ?
                    new Date(order.pickup_time).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }) : '-',
                jam: order.pickup_time ?
                    new Date(order.pickup_time).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }) : '-',
                status: order.status_pickup || 'siap pickup',
                layanan: order.layanan || 'Regular',
                created_at: order.created_at
            };
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            message: 'Data pickup queue berhasil diambil',
            success: true,
            data: {
                orders: transformedOrders,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: count,
                    items_per_page: limit,
                    has_next_page: hasNextPage,
                    has_prev_page: hasPrevPage,
                },
                filters: {
                    hub_id,
                    svc_source_id,
                    status_pickup: status_pickup || 'Pending/Unassigned',
                    priority,
                    search,
                    date_from,
                    date_to,
                    sort_by,
                    sort_order,
                },
            },
        };
    }

    async assignDriver(assignDriverDto: AssignDriverDto) {
        const { order_ids, driver_id, notes } = assignDriverDto;

        // 1. Validasi driver
        const driver = await this.userModel.findByPk(driver_id, { raw: true });
        if (!driver) {
            throw new NotFoundException('Driver tidak ditemukan');
        }

        // Validasi level driver (pastikan adalah kurir)
        if ((driver as any).level !== 3) { // Asumsi level 3 adalah kurir
            throw new BadRequestException('User yang dipilih bukan kurir');
        }

        // 2. Validasi orders
        const orders = await this.orderModel.findAll({
            where: {
                id: { [Op.in]: order_ids }
            },
            raw: true,
        });

        if (orders.length !== order_ids.length) {
            throw new BadRequestException('Beberapa order ID tidak ditemukan');
        }

        // 3. Validasi status orders
        const invalidOrders = orders.filter(order =>
            order.status_pickup === 'Assigned' ||
            order.status_pickup === 'Picked Up' ||
            order.status_pickup === 'Delivered'
        );

        if (invalidOrders.length > 0) {
            throw new BadRequestException(
                `Order dengan ID ${invalidOrders.map(o => o.id).join(', ')} tidak dapat ditugaskan karena status: ${invalidOrders.map(o => o.status_pickup).join(', ')}`
            );
        }

        // 4. Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const results: any = {
                success: [],
                failed: []
            };

            for (const order of orders) {
                try {
                    // 5. Buat atau update order_pickup_drivers
                    // @ts-ignore
                    await this.orderPickupDriverModel.create({
                        order_id: order.id,
                        driver_id: driver_id,
                        assign_date: new Date(),
                        name: driver.name,
                        photo: (driver as any).photo || '',
                        notes: notes || '',
                        signature: '',
                        status: 0, // Pending/Assigned
                        svc_id: order.svc_source_id?.toString() || '',
                        latlng: '',
                    }, { transaction });

                    // 6. Update order
                    await this.orderModel.update({
                        assign_driver: driver_id,
                        pickup_by: driver.name,
                        status_pickup: 'Assigned',
                        is_gagal_pickup: 0,
                    }, {
                        where: { id: order.id },
                        transaction
                    });

                    // 8. Buat notifikasi untuk driver
                    // @ts-ignore
                    await this.orderNotifikasiModel.create({
                        message: `Anda memiliki tugas pickup baru - Order: ${order.no_tracking}`,
                        order_id: order.id,
                        svc_source: order.svc_source_id,
                        hub_source: order.hub_source_id,
                        svc_dest: order.svc_dest_id,
                        hub_dest: order.hub_dest_id,
                        status: 1,
                        reweight: 0,
                        pembayaran: 0,
                        voucher: 0,
                        saldo: 0,
                        pengiriman: '1',
                        news: 0,
                        user_id: driver_id,
                    }, { transaction });

                    results.success.push({
                        order_id: order.id,
                        no_tracking: order.no_tracking,
                        driver_name: driver.name,
                        status: 'Assigned'
                    });

                } catch (error) {
                    results.failed.push({
                        order_id: order.id,
                        no_tracking: order.no_tracking,
                        error: error.message
                    });
                }
            }

            // Commit transaction
            await transaction.commit();

            return {
                message: 'Penugasan driver berhasil diproses',
                success: true,
                data: {
                    total_orders: order_ids.length,
                    success_count: results.success.length,
                    failed_count: results.failed.length,
                    success: results.success,
                    failed: results.failed
                }
            };

        } catch (error) {
            // Rollback transaction
            await transaction.rollback();
            throw new BadRequestException(`Gagal menugaskan driver: ${error.message}`);
        }
    }

    async getPickupDetail(orderId: number) {
        // 1. Ambil detail order
        const order = await this.orderModel.findByPk(orderId, {
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: ['id', 'qty', 'berat', 'panjang', 'lebar', 'tinggi'],
                }
            ],
            raw: false,
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // 2. Ambil detail pickup driver
        const pickupDriver = await this.orderPickupDriverModel.findOne({
            where: { order_id: orderId },
            raw: true,
        });

        // 3. Ambil detail driver jika ada
        let driverDetail: any = null;
        if (pickupDriver) {
            driverDetail = await this.userModel.findByPk(pickupDriver.driver_id, {
                attributes: ['id', 'name', 'phone', 'level'],
                raw: true,
            });
        }

        // 4. Ambil detail pieces
        const pieces = await this.orderPieceModel.findAll({
            where: { order_id: orderId },
            attributes: [
                'id', 'piece_id', 'berat', 'panjang', 'lebar', 'tinggi',
                'pickup_status', 'created_at', 'updated_at'
            ],
            raw: true,
        });

        // 5. Ambil history pickup
        const pickupHistories = await this.orderHistoryModel.findAll({
            where: {
                order_id: orderId,
                status: {
                    [Op.or]: [
                        'Driver Assigned',
                        'Piece Scanned for Pickup',
                        'Pickup Completed',
                        'Pickup Failed',
                        'Pickup Started',
                        'Pickup Confirmed'
                    ]
                }
            },
            attributes: [
                'id', 'status', 'remark', 'base64Foto',
                'base64SignDriver', 'base64SignCustomer', 'latlng',
                'created_at', 'created_by', 'provinsi', 'kota'
            ],
            order: [['created_at', 'ASC']],
            raw: true,
        });

        // 6. Ambil request cancel jika ada
        let cancelRequest: any = null;
        if (order.is_gagal_pickup === 1) {
            cancelRequest = await this.requestCancelModel.findOne({
                where: { order_id: orderId },
                attributes: ['id', 'reason', 'status', 'created_at'],
                raw: true,
            });
        }

        // 7. Hitung total koli dan berat dari shipments
        let totalKoli = 0;
        let totalBerat = 0;

        if (order.getDataValue('shipments') && order.getDataValue('shipments').length > 0) {
            order.getDataValue('shipments').forEach((shipment: any) => {
                totalKoli += shipment.getDataValue('qty') || 0;
                totalBerat += (shipment.getDataValue('berat') || 0) * (shipment.getDataValue('qty') || 0);
            });
        }

        // 8. Format response
        const response = {
            order: {
                id: order.getDataValue('id'),
                no_tracking: order.getDataValue('no_tracking'),
                status_pickup: order.getDataValue('status_pickup'),
                pickup_time: order.getDataValue('pickup_time'),
                is_gagal_pickup: order.getDataValue('is_gagal_pickup'),
                assign_driver: order.getDataValue('assign_driver'),
                pickup_by: order.getDataValue('pickup_by'),
                created_at: order.getDataValue('created_at'),
                updated_at: order.getDataValue('updated_at'),
            },
            pengirim: {
                nama: order.getDataValue('nama_pengirim'),
                alamat: order.getDataValue('alamat_pengirim'),
                provinsi: order.getDataValue('provinsi_pengirim'),
                kota: order.getDataValue('kota_pengirim'),
                kecamatan: order.getDataValue('kecamatan_pengirim'),
                kelurahan: order.getDataValue('kelurahan_pengirim'),
                kodepos: order.getDataValue('kodepos_pengirim'),
                telepon: order.getDataValue('no_telepon_pengirim'),
                email: order.getDataValue('email_pengirim'),
            },
            penerima: {
                nama: order.getDataValue('nama_penerima'),
                alamat: order.getDataValue('alamat_penerima'),
                provinsi: order.getDataValue('provinsi_penerima'),
                kota: order.getDataValue('kota_penerima'),
                kecamatan: order.getDataValue('kecamatan_penerima'),
                kelurahan: order.getDataValue('kelurahan_penerima'),
                kodepos: order.getDataValue('kodepos_penerima'),
                telepon: order.getDataValue('no_telepon_penerima'),
                email: order.getDataValue('email_penerima'),
            },
            barang: {
                nama_barang: order.getDataValue('nama_barang'),
                total_koli: totalKoli,
                total_berat: totalBerat,
                pieces: pieces,
            },
            lokasi: {
                svc_source_id: order.getDataValue('svc_source_id'),
                hub_source_id: order.getDataValue('hub_source_id'),
                latlng_asal: order.getDataValue('latlngAsal'),
            },
            driver: pickupDriver ? {
                ...pickupDriver,
                detail: driverDetail,
            } : null,
            histories: pickupHistories,
            cancel_request: cancelRequest,
        };

        return {
            message: 'Detail pickup berhasil diambil',
            success: true,
            data: response,
        };
    }

    async reschedulePickup(rescheduleDto: ReschedulePickupDto) {
        const {
            order_id,
            new_pickup_time,
            reason_reschedule,
            rescheduled_by_user_id,
        } = rescheduleDto;

        // Validasi waktu pickup baru tidak di masa lalu
        const newPickupTime = new Date(new_pickup_time);
        const now = new Date();

        if (newPickupTime <= now) {
            throw new BadRequestException('Waktu pickup baru harus di masa depan');
        }

        // Validasi order exists
        const order = await this.orderModel.findByPk(order_id);
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Validasi order status memungkinkan reschedule
        if (order.getDataValue('status_pickup') === 'Completed' || order.getDataValue('status_pickup') === 'In Transit') {
            throw new BadRequestException('Order tidak dapat di-reschedule karena sudah selesai');
        }

        // Mulai transaction
        const transaction = await this.orderModel.sequelize?.transaction();

        try {
            // 1. Update orders table
            await this.orderModel.update(
                {
                    pickup_time: newPickupTime,
                    status_pickup: 'Pending',
                    is_gagal_pickup: 0,
                    assign_driver: 0,
                    pickup_by: 0,
                    remark_sales: `Rescheduled: ${reason_reschedule}`,
                },
                {
                    where: { id: order_id },
                    transaction,
                }
            );

            // 2. Update order_pickup_drivers jika ada
            await this.orderPickupDriverModel.update(
                {
                    status: 2, // Status rescheduled
                },
                {
                    where: { order_id },
                    transaction,
                }
            );

            // 3. Update request_cancel jika ada
            await this.requestCancelModel.update(
                {
                    status: 2, // Status rescheduled
                },
                {
                    where: { order_id },
                    transaction,
                }
            );

            // 5. Create order_notifikasi untuk customer
            await this.orderNotifikasiModel.create(
                {
                    message: `Jadwal pickup order #${order.getDataValue('no_tracking')} telah diubah ke ${new_pickup_time}`,
                    order_id,
                    svc_source: order.getDataValue('svc_source_id'),
                    hub_source: order.getDataValue('hub_source_id'),
                    svc_dest: order.getDataValue('svc_dest_id'),
                    hub_dest: order.getDataValue('hub_dest_id'),
                    user_id: order.getDataValue('order_by'),
                    pengiriman: '1',
                } as any,
                { transaction }
            );

            await transaction?.commit();

            return {
                message: 'Pickup berhasil di-reschedule',
                success: true,
                data: {
                    order_id,
                    old_pickup_time: order.getDataValue('pickup_time'),
                    new_pickup_time,
                    reason_reschedule,
                    rescheduled_by: rescheduled_by_user_id,
                    rescheduled_at: new Date(),
                },
            };

        } catch (error) {
            await transaction?.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    async confirmPickup(confirmDto: ConfirmPickupDto) {
        const {
            order_id,
            status,
            photo,
            signature,
            notes,
            latlng,
            user_id,
            reason,
        } = confirmDto;

        // Validasi status
        const isSuccess = status === 'success' || status === 'completed';
        const isFailed = status === 'failed' || status === 'cancelled';

        if (!isSuccess && !isFailed) {
            throw new BadRequestException('Status tidak valid');
        }

        // Validasi reason untuk pickup gagal
        if (isFailed && !reason) {
            throw new BadRequestException('Alasan kegagalan wajib diisi');
        }

        // Validasi order exists
        const order = await this.orderModel.findByPk(order_id);
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Validasi order status memungkinkan konfirmasi
        if (order.getDataValue('status_pickup') === 'Completed' || order.getDataValue('status_pickup') === 'In Transit') {
            throw new BadRequestException('Order tidak dapat dikonfirmasi karena sudah selesai');
        }

        // Mulai transaction
        const transaction = await this.orderModel.sequelize?.transaction();

        try {
            const now = new Date();
            const pickupStatus = isSuccess ? 'Completed' : 'Failed';
            const orderPickupStatus = isSuccess ? 1 : 2; // 1: Completed, 2: Failed

            // 1. Update orders table
            await this.orderModel.update(
                {
                    status_pickup: pickupStatus,
                    is_gagal_pickup: isFailed ? 1 : 0,
                    pickup_time: isSuccess ? now : order.getDataValue('pickup_time'),
                    remark_traffic: isFailed ? reason : notes,
                },
                {
                    where: { id: order_id },
                    transaction,
                }
            );

            // 2. Update order_pickup_drivers
            await this.orderPickupDriverModel.update(
                {
                    status: orderPickupStatus,
                    photo: photo || '',
                    notes: notes || '',
                    signature: signature || '',
                    latlng: latlng,
                    updated_at: now,
                } as any,
                {
                    where: { order_id },
                    transaction,
                }
            );

            // 3. Update order_pieces jika pickup berhasil
            if (isSuccess) {
                await this.orderPieceModel.update(
                    {
                        pickup_status: 1, // Picked Up
                        updatedAt: now,
                    },
                    {
                        where: { order_id },
                        transaction,
                    }
                );
            }

            // 5. Create order_notifikasi
            const notificationMessage = isSuccess
                ? `Barang order #${order.getDataValue('no_tracking')} telah berhasil di-pickup`
                : `Pickup order #${order.getDataValue('no_tracking')} gagal. Alasan: ${reason}`;

            await this.orderNotifikasiModel.create(
                {
                    message: notificationMessage,
                    order_id,
                    svc_source: order.getDataValue('svc_source_id'),
                    hub_source: order.getDataValue('hub_source_id'),
                    svc_dest: order.getDataValue('svc_dest_id'),
                    hub_dest: order.getDataValue('hub_dest_id'),
                    user_id: order.getDataValue('order_by'),
                    pengiriman: '1',
                } as any,
                { transaction }
            );

            // 6. Create request_cancel jika pickup gagal
            if (isFailed) {
                await this.requestCancelModel.create(
                    {
                        order_id,
                        user_id: order.getDataValue('order_by'),
                        reason: reason,
                        status: 1, // Pending cancellation
                    } as any,
                    { transaction }
                );
            }

            await transaction?.commit();

            return {
                message: `Pickup berhasil dikonfirmasi sebagai ${isSuccess ? 'berhasil' : 'gagal'}`,
                success: true,
                data: {
                    order_id,
                    status: pickupStatus,
                    confirmed_at: now,
                    confirmed_by: user_id,
                    location: latlng,
                    notes: notes || reason,
                },
            };

        } catch (error) {
            await transaction?.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    async getPickupSummary(params: PickupSummaryDto) {
        const {
            date,
            start_date,
            end_date,
            hub_id,
            driver_id,
            interval = 'daily',
        } = params;

        // Build date filter
        let dateFilter: any = {};

        if (date) {
            const targetDate = new Date(date);
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);

            dateFilter = {
                [Op.gte]: targetDate,
                [Op.lt]: nextDate,
            };
        } else if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            endDate.setDate(endDate.getDate() + 1); // Include end date

            dateFilter = {
                [Op.gte]: startDate,
                [Op.lt]: endDate,
            };
        } else {
            // Default to today
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            dateFilter = {
                [Op.gte]: today,
                [Op.lt]: tomorrow,
            };
        }

        // Build where condition
        const whereCondition: any = {};

        if (hub_id) {
            whereCondition.hub_source_id = hub_id;
        }

        if (driver_id) {
            whereCondition.assign_driver = driver_id;
        }

        // 1. Get pickup statistics from orders table
        const pickupStats = await this.orderModel.findAll({
            where: {
                ...whereCondition,
                pickup_time: dateFilter,
            },
            attributes: [
                'status_pickup',
                'is_gagal_pickup',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['status_pickup', 'is_gagal_pickup'],
            raw: true,
        });

        // 2. Get pickup statistics from order_histories for more accuracy
        const historyWhereCondition: any = {
            status: {
                [Op.in]: ['Pickup Completed', 'Pickup Failed', 'Pickup Cancelled'],
            },
        };

        if (date) {
            historyWhereCondition.date = date;
        }

        const historyStats = await this.orderHistoryModel.findAll({
            where: historyWhereCondition,
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['status'],
            raw: true,
        });

        // 3. Get driver performance if driver_id is specified
        let driverPerformance: any = null;
        if (driver_id) {
            const driver = await this.userModel.findByPk(driver_id, {
                attributes: ['id', 'name', 'phone'],
                raw: true,
            });

            if (driver) {
                const driverPickups = await this.orderPickupDriverModel.findAll({
                    where: {
                        driver_id,
                        assign_date: dateFilter,
                    },
                    attributes: [
                        'status',
                        [fn('COUNT', col('id')), 'count'],
                    ],
                    group: ['status'],
                    raw: true,
                });

                driverPerformance = {
                    driver,
                    pickups: driverPickups,
                };
            }
        }

        // 4. Get hub performance if hub_id is specified
        let hubPerformance: any = null;
        if (hub_id) {
            const hubPickups = await this.orderModel.findAll({
                where: {
                    hub_source_id: hub_id,
                    pickup_time: dateFilter,
                },
                attributes: [
                    'status_pickup',
                    [fn('COUNT', col('id')), 'count'],
                ],
                group: ['status_pickup'],
                raw: true,
            });

            hubPerformance = {
                hub_id,
                pickups: hubPickups,
            };
        }

        // 5. Calculate summary statistics
        let totalPickups = 0;
        let successfulPickups = 0;
        let failedPickups = 0;
        let pendingPickups = 0;

        // Calculate from orders table
        pickupStats.forEach((stat: any) => {
            const count = parseInt(stat.count);
            totalPickups += count;

            if (stat.status_pickup === 'Completed' && stat.is_gagal_pickup === 0) {
                successfulPickups += count;
            } else if (stat.is_gagal_pickup === 1 || stat.status_pickup === 'Failed') {
                failedPickups += count;
            } else if (stat.status_pickup === 'Pending' || stat.status_pickup === 'Assigned') {
                pendingPickups += count;
            }
        });

        // Calculate success rate
        const successRate = totalPickups > 0 ? (successfulPickups / totalPickups) * 100 : 0;

        // 6. Get top failure reasons
        const failureReasons = await this.requestCancelModel.findAll({
            where: {
                created_at: dateFilter,
                status: 1, // Pending cancellation
            },
            attributes: [
                'reason',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['reason'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: 5,
            raw: true,
        });

        // 7. Get average pickup time (if data available)
        const avgPickupTime = await this.orderPickupDriverModel.findAll({
            where: {
                status: 1, // Completed
                assign_date: dateFilter,
            },
            attributes: [
                [fn('AVG', fn('TIMESTAMPDIFF', literal('MINUTE'), col('assign_date'), col('updated_at'))), 'avg_minutes'],
            ],
            raw: true,
        });

        const averagePickupMinutes = (avgPickupTime[0] as any)?.avg_minutes || 0;

        return {
            message: 'Statistik pickup berhasil diambil',
            success: true,
            data: {
                period: {
                    date: date || null,
                    start_date: start_date || null,
                    end_date: end_date || null,
                    interval,
                },
                summary: {
                    total_pickups: totalPickups,
                    successful_pickups: successfulPickups,
                    failed_pickups: failedPickups,
                    pending_pickups: pendingPickups,
                    success_rate: Math.round(successRate * 100) / 100,
                    average_pickup_time_minutes: Math.round(averagePickupMinutes * 100) / 100,
                },
                breakdown: {
                    by_status: pickupStats,
                    by_history: historyStats,
                },
                driver_performance: driverPerformance,
                hub_performance: hubPerformance,
                failure_analysis: {
                    top_reasons: failureReasons,
                },
            },
        };
    }
}