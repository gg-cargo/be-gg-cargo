import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { User } from '../models/user.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';
import { LogGps } from '../models/log-gps.model';
import { Order } from '../models/order.model';
import { Hub } from '../models/hub.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderNotifikasi } from '../models/order-notifikasi.model';
import { AvailableDriversDto, AvailableDriversForPickupDto, AvailableDriversForDeliverDto, AvailableDriversResponseDto, AvailableDriverDto, DriverLocationDto } from './dto/available-drivers.dto';
import { DriverStatusSummaryQueryDto, DriverStatusSummaryResponseDto, DriverStatusSummaryDto, DriverWorkloadDto } from './dto/driver-status-summary.dto';
import { AssignDriverDto, AssignDriverResponseDto } from './dto/assign-driver.dto';
import { MyTasksQueryDto, MyTasksResponseDto, DriverTaskDto, TaskStatisticsDto } from './dto/my-tasks.dto';
import { AcceptTaskResponseDto } from './dto/accept-task.dto';
import { ConfirmDeliveryDto } from './dto/confirm-delivery.dto';
import { getOrderHistoryDateTime } from '../common/utils/date.utils';
import { ORDER_STATUS } from 'src/common/constants/order-status.constants';
import { NotificationBadgesService } from '../notification-badges/notification-badges.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);

    constructor(
        @InjectModel(User)
        private userModel: typeof User,
        @InjectModel(OrderPickupDriver)
        private orderPickupDriverModel: typeof OrderPickupDriver,
        @InjectModel(OrderDeliverDriver)
        private orderDeliverDriverModel: typeof OrderDeliverDriver,
        @InjectModel(Order)
        private orderModel: typeof Order,
        @InjectModel(LogGps)
        private logGpsModel: typeof LogGps,
        @InjectModel(Hub)
        private hubModel: typeof Hub,
        @InjectModel(OrderHistory)
        private orderHistoryModel: typeof OrderHistory,
        @InjectModel(OrderPiece)
        private orderPieceModel: typeof OrderPiece,
        @InjectModel(OrderNotifikasi)
        private orderNotifikasiModel: typeof OrderNotifikasi,
        private readonly notificationBadgesService: NotificationBadgesService,
        private readonly whatsappService: WhatsappService,
    ) { }

    async getAvailableDrivers(params: AvailableDriversDto) {
        const {
            hub_id,
            service_center_id,
            include_location = false,
            page = 1,
            limit = 20,
            search,
            only_online = false,
        } = params;

        const offset = (page - 1) * limit;

        // Build where condition untuk driver yang tersedia
        const whereCondition: any = {
            aktif: 1, // Driver aktif
            status_app: 1, // Aplikasi terbuka
            freeze_saldo: 0, // Tidak dibekukan saldo
            freeze_gps: 0, // GPS tidak dibekukan
        };

        whereCondition.level = 8;

        if (hub_id) {
            whereCondition.hub_id = hub_id;
        }

        // Filter berdasarkan service_center_id
        if (service_center_id) {
            whereCondition.service_center_id = service_center_id;
        }

        // Filter berdasarkan search (nama atau phone)
        if (search) {
            whereCondition[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
            ];
        }

        // Filter hanya driver online (yang memiliki update GPS dalam 30 menit terakhir)
        if (only_online) {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            whereCondition.last_update_gps = {
                [Op.gte]: thirtyMinutesAgo,
            };
        }

        // Query utama untuk mendapatkan driver
        const { count, rows: drivers } = await this.userModel.findAndCountAll({
            where: whereCondition,
            attributes: [
                'id',
                'name',
                'phone',
                'email',
                'level',
                'hub_id',
                'service_center_id',
                'latlng',
                'last_update_gps',
                'status_app',
                'aktif',
                'freeze_saldo',
                'freeze_gps',
                'created_at',
            ],
            limit,
            offset,
            order: [['name', 'ASC']],
            raw: true,
        });

        // Jika diminta include location, ambil data GPS terbaru
        if (include_location) {
            for (const driver of drivers) {
                const latestGps = await this.logGpsModel.findOne({
                    where: { user_id: driver.id.toString() },
                    attributes: ['latlng', 'type', 'provider', 'country', 'created_at'],
                    order: [['created_at', 'DESC']],
                    raw: true,
                });

                if (latestGps) {
                    (driver as any).current_location = latestGps;
                }
            }
        }

        // Hitung driver yang sedang dalam tugas pickup
        const busyDriverIds = await this.orderPickupDriverModel.findAll({
            where: {
                status: 0, // Status pending/aktif
            },
            attributes: ['driver_id'],
            raw: true,
        });

        const busyDriverIdSet = new Set(busyDriverIds.map(d => d.driver_id));

        // Tambahkan status ketersediaan
        const driversWithAvailability = drivers.map(driver => ({
            ...driver,
            is_available: !busyDriverIdSet.has(driver.id),
            current_task: busyDriverIdSet.has(driver.id) ? 'Pickup Task' : 'Available',
        }));

        // Hitung statistik
        const totalAvailable = driversWithAvailability.filter(d => d.is_available).length;
        const totalBusy = driversWithAvailability.filter(d => !d.is_available).length;

        return {
            message: 'Daftar driver tersedia berhasil diambil',
            success: true,
            data: {
                drivers: driversWithAvailability,
                pagination: {
                    page,
                    limit,
                    total: count,
                    total_pages: Math.ceil(count / limit),
                },
                statistics: {
                    total_drivers: count,
                    available: totalAvailable,
                    busy: totalBusy,
                },
            },
        };
    }

    /**
     * Ambil hub fallback dari order: prioritas hub_source_id, lalu hub_dest_id.
     */
    async getOrderHubFallback(orderId: number): Promise<number | undefined> {
        if (!orderId) return undefined;
        const order = await this.orderModel.findByPk(orderId, {
            attributes: ['hub_source_id', 'hub_dest_id'],
        });
        if (!order) return undefined;
        const hubSourceId = order.getDataValue('hub_source_id');
        const hubDestId = order.getDataValue('hub_dest_id');
        return hubSourceId ?? hubDestId ?? undefined;
    }

    /**
     * Ambil hub destination fallback dari order: prioritas hub_dest_id, lalu hub_source_id.
     */
    async getOrderHubDestFallback(orderId: number): Promise<number | undefined> {
        if (!orderId) return undefined;
        const order = await this.orderModel.findByPk(orderId, {
            attributes: ['hub_source_id', 'hub_dest_id'],
        });
        if (!order) return undefined;
        const hubSourceId = order.getDataValue('hub_source_id');
        const hubDestId = order.getDataValue('hub_dest_id');
        return hubDestId ?? hubSourceId ?? undefined;
    }

    async getDriverStatusSummary(params: DriverStatusSummaryQueryDto, userId: number): Promise<DriverStatusSummaryResponseDto> {
        const { date = new Date().toISOString().split('T')[0], status } = params;

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

        // Build where condition untuk driver
        const whereCondition: any = {
            aktif: 1, // Driver aktif
            level: 8, // Level driver/kurir
        };

        // Filter berdasarkan hub_id user yang sedang login
        if (userHubId) {
            whereCondition.hub_id = userHubId;
        } else if (userServiceCenterId) {
            whereCondition.hub_id = userServiceCenterId;
        }

        // Filter berdasarkan status online/offline
        if (status === 'online') {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            whereCondition.last_update_gps = {
                [Op.gte]: thirtyMinutesAgo,
            };
        } else if (status === 'offline') {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            whereCondition.last_update_gps = {
                [Op.lt]: thirtyMinutesAgo,
            };
        }

        // Query utama untuk mendapatkan driver
        const drivers = await this.userModel.findAll({
            where: whereCondition,
            attributes: [
                'id',
                'name',
                'phone',
                'hub_id',
                'latlng',
                'last_update_gps',
            ],
            order: [['name', 'ASC']],
            raw: true,
        });

        const driversWithSummary: DriverStatusSummaryDto[] = [];
        const driverIds = drivers.map((driver: any) => driver.id);
        let pickupTasksForAvailability: any[] = [];
        let deliveryTasksForAvailability: any[] = [];
        const orderStatusMap = new Map<number, { status_pickup: string | null; status_deliver: string | null }>();

        if (driverIds.length > 0) {
            pickupTasksForAvailability = await this.orderPickupDriverModel.findAll({
                where: {
                    driver_id: {
                        [Op.in]: driverIds,
                    },
                },
                attributes: ['driver_id', 'order_id', 'status'],
                raw: true,
            });

            deliveryTasksForAvailability = await this.orderDeliverDriverModel.findAll({
                where: {
                    driver_id: {
                        [Op.in]: driverIds,
                    },
                },
                attributes: ['driver_id', 'order_id', 'status'],
                raw: true,
            });

            const relatedOrderIds = new Set<number>();
            for (const task of pickupTasksForAvailability) {
                if (task?.order_id !== undefined && task?.order_id !== null) {
                    relatedOrderIds.add(Number(task.order_id));
                }
            }
            for (const task of deliveryTasksForAvailability) {
                if (task?.order_id !== undefined && task?.order_id !== null) {
                    relatedOrderIds.add(Number(task.order_id));
                }
            }

            if (relatedOrderIds.size > 0) {
                const orders = await this.orderModel.findAll({
                    where: {
                        id: {
                            [Op.in]: Array.from(relatedOrderIds),
                        },
                    },
                    attributes: ['id', 'status_pickup', 'status_deliver'],
                    raw: true,
                });

                for (const order of orders) {
                    orderStatusMap.set(order.id, {
                        status_pickup: order.status_pickup ?? null,
                        status_deliver: order.status_deliver ?? null,
                    });
                }
            }
        }

        for (const driver of drivers) {
            // Hitung beban kerja pickup untuk tanggal tertentu
            const pickupTasks = await this.orderPickupDriverModel.count({
                where: {
                    driver_id: driver.id,
                    assign_date: {
                        [Op.between]: [
                            new Date(date + 'T00:00:00.000Z'),
                            new Date(date + 'T23:59:59.999Z')
                        ]
                    }
                }
            });

            // Hitung beban kerja delivery untuk tanggal tertentu
            const deliveryTasks = await this.orderDeliverDriverModel.count({
                where: {
                    driver_id: driver.id,
                    assign_date: {
                        [Op.between]: [
                            new Date(date + 'T00:00:00.000Z'),
                            new Date(date + 'T23:59:59.999Z')
                        ]
                    }
                }
            });

            // Hitung tugas pending (status = 0)
            const pendingPickupTasks = await this.orderPickupDriverModel.count({
                where: {
                    driver_id: driver.id,
                    status: 0
                }
            });

            const pendingDeliveryTasks = await this.orderDeliverDriverModel.count({
                where: {
                    driver_id: driver.id,
                    status: 0
                }
            });

            const totalPendingTasks = pendingPickupTasks + pendingDeliveryTasks;

            const pickupTasksForDriver = pickupTasksForAvailability.filter(task => Number(task.driver_id) === driver.id);
            const deliveryTasksForDriver = deliveryTasksForAvailability.filter(task => Number(task.driver_id) === driver.id);

            const hasReadyPickupTask = pickupTasksForDriver.some(task => {
                const order = orderStatusMap.get(Number(task.order_id));
                if (!order) {
                    return false;
                }
                const taskStatus = Number(task.status);
                const orderStatusPickup = order.status_pickup;
                return (taskStatus === 0 || taskStatus === 2) && (orderStatusPickup === null || orderStatusPickup === undefined);
            });

            const hasReadyDeliveryTask = deliveryTasksForDriver.some(task => {
                const order = orderStatusMap.get(Number(task.order_id));
                if (!order) {
                    return false;
                }
                const taskStatus = Number(task.status);
                const orderStatusDeliver = order.status_deliver;
                return (taskStatus === 0 || taskStatus === 2) && (orderStatusDeliver === null || orderStatusDeliver === undefined);
            });

            const hasAnyTask = pickupTasksForDriver.length > 0 || deliveryTasksForDriver.length > 0;

            // Tentukan status ketersediaan sesuai ketentuan baru
            const statusKetersediaan: 'siap' | 'sibuk' =
                hasReadyPickupTask || hasReadyDeliveryTask || !hasAnyTask ? 'siap' : 'sibuk';

            // Ambil nama hub untuk area kerja
            let areaKerja = 'Unknown Hub';
            if (driver.hub_id) {
                const hub = await this.hubModel.findByPk(driver.hub_id, {
                    attributes: ['nama'],
                    raw: true
                });
                areaKerja = hub ? hub.nama : `Hub ${driver.hub_id}`;
            }

            const driverSummary: DriverStatusSummaryDto = {
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                status_ketersediaan: statusKetersediaan,
                lokasi_saat_ini: driver.latlng || 'Tidak tersedia',
                terakhir_update_gps: driver.last_update_gps ? driver.last_update_gps.toISOString() : 'Tidak tersedia',
                beban_kerja_hari_ini: {
                    pickup_tasks: pickupTasks,
                    delivery_tasks: deliveryTasks,
                    tugas_pending: totalPendingTasks
                },
                area_kerja: areaKerja
            };

            driversWithSummary.push(driverSummary);
        }

        // Hitung driver statistics
        const driverStatistics = await this.calculateDriverStatisticsForHub(userHubId || userServiceCenterId);

        return {
            status: 'success',
            date: date,
            hub_id: userHubId || userServiceCenterId,
            driver_statistics: driverStatistics,
            drivers: driversWithSummary
        };
    }

    /**
     * Mendapatkan daftar kurir yang tersedia untuk pickup berdasarkan order
     */
    async getAvailableDriversForPickup(
        query: AvailableDriversForPickupDto
    ): Promise<AvailableDriversResponseDto> {
        try {
            // 1. Ambil data order untuk mendapatkan lokasi dan service center
            const order = await this.orderModel.findByPk(query.order_id, {
                attributes: [
                    'id',
                    'latlngAsal',
                    'svc_source_id',
                    'hub_source_id',
                    'status_pickup',
                    'is_gagal_pickup'
                ]
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // Validasi status order
            const statusPickup = order.getDataValue('status_pickup');
            const isGagalPickup = order.getDataValue('is_gagal_pickup');

            // if ((statusPickup && statusPickup !== 'siap pickup') || isGagalPickup === 1) {
            //     throw new BadRequestException('Order tidak dalam status yang dapat ditugaskan untuk pickup');
            // }

            // 2. Parse lokasi order
            let orderLocation: DriverLocationDto = { lat: 0, lng: 0 };
            const latlngAsal = order.getDataValue('latlngAsal');
            if (latlngAsal) {
                try {
                    // Handle format string langsung "lat,lng"
                    if (typeof latlngAsal === 'string' && latlngAsal.includes(',')) {
                        const [lat, lng] = latlngAsal.split(',').map(coord => parseFloat(coord.trim()));
                        if (!isNaN(lat) && !isNaN(lng)) {
                            orderLocation = { lat, lng };
                        }
                    } else {
                        // Handle format JSON
                        const latlngData = JSON.parse(latlngAsal);

                        // Handle format array of objects dengan field latlng
                        if (Array.isArray(latlngData) && latlngData.length > 0) {
                            // Ambil koordinat pertama (lokasi asal)
                            const firstLocation = latlngData[0];
                            if (firstLocation.latlng) {
                                const [lat, lng] = firstLocation.latlng.split(',').map(coord => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    orderLocation = { lat, lng };
                                }
                            }
                        } else if (latlngData.lat && latlngData.lng) {
                            // Handle format object langsung {lat: x, lng: y}
                            orderLocation = { lat: latlngData.lat, lng: latlngData.lng };
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Invalid latlng format for order ${query.order_id}: ${latlngAsal}`);
                }
            }

            const svcSourceId = order.getDataValue('svc_source_id');
            const hubSourceId = order.getDataValue('hub_source_id');

            // 3. Cari kurir yang memenuhi kriteria
            const driverWhereClause: any = {
                level: { [Op.eq]: 8 },
                aktif: 1,
                status_app: 1,
                freeze_saldo: 0,
                freeze_gps: 0
            };

            // Filter berdasarkan service center atau hub
            if (query.hub_id) {
                driverWhereClause.hub_id = query.hub_id;
            } else if (svcSourceId) {
                driverWhereClause.service_center_id = svcSourceId;
            } else if (hubSourceId) {
                driverWhereClause.hub_id = hubSourceId;
            }

            const drivers = await this.userModel.findAll({
                where: driverWhereClause,
                attributes: [
                    'id',
                    'name',
                    'phone',
                    'latlng',
                    'service_center_id',
                    'hub_id'
                ]
            });

            // 4. Filter dan hitung beban kerja kurir
            const availableDrivers: AvailableDriverDto[] = [];

            for (const driver of drivers) {
                const driverId = driver.getDataValue('id');

                // Hitung tugas yang sedang berjalan (pickup tasks saja untuk saat ini)
                const currentPickupTasks = await this.orderModel.count({
                    where: {
                        assign_driver: driverId,
                        status_pickup: { [Op.in]: ['Assigned', 'Picked Up'] }
                    }
                });

                // Untuk delivery tasks, gunakan tabel order_pickup_drivers jika ada
                let currentDeliveryTasks = 0;
                if (this.orderModel.sequelize?.models.OrderPickupDriver) {
                    const OrderPickupDriver = this.orderModel.sequelize.models.OrderPickupDriver;
                    currentDeliveryTasks = await OrderPickupDriver.count({
                        where: {
                            driver_id: driverId,
                            status: { [Op.in]: [1, 2] } // 1: in progress, 2: completed
                        }
                    });
                }

                const totalCurrentTasks = currentPickupTasks + currentDeliveryTasks;

                // Kurir dianggap tersedia jika tugas < 10
                if (totalCurrentTasks < 10) {
                    // Parse lokasi kurir
                    let driverLocation: DriverLocationDto = { lat: 0, lng: 0 };
                    const driverLatlng = driver.getDataValue('latlng');
                    if (driverLatlng) {
                        try {
                            // Handle format string langsung "lat,lng"
                            if (typeof driverLatlng === 'string' && driverLatlng.includes(',')) {
                                const [lat, lng] = driverLatlng.split(',').map(coord => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    driverLocation = { lat, lng };
                                }
                            } else {
                                // Handle format JSON
                                const latlngData = JSON.parse(driverLatlng);

                                // Handle format array of objects dengan field latlng
                                if (Array.isArray(latlngData) && latlngData.length > 0) {
                                    // Ambil koordinat terakhir (lokasi saat ini)
                                    const lastLocation = latlngData[latlngData.length - 1];
                                    if (lastLocation.latlng) {
                                        const [lat, lng] = lastLocation.latlng.split(',').map(coord => parseFloat(coord.trim()));
                                        if (!isNaN(lat) && !isNaN(lng)) {
                                            driverLocation = { lat, lng };
                                        }
                                    }
                                } else if (latlngData.lat && latlngData.lng) {
                                    // Handle format object langsung {lat: x, lng: y}
                                    driverLocation = { lat: latlngData.lat, lng: latlngData.lng };
                                }
                            }
                        } catch (error) {
                            this.logger.warn(`Invalid latlng format for driver ${driverId}: ${driverLatlng}`);
                        }
                    }

                    // Hitung jarak dari order (simplified calculation)
                    let distance = 0;
                    if (orderLocation.lat && orderLocation.lng && driverLocation.lat && driverLocation.lng) {
                        distance = this.calculateDistance(
                            orderLocation.lat, orderLocation.lng,
                            driverLocation.lat, driverLocation.lng
                        );
                    }

                    availableDrivers.push({
                        id: driverId,
                        name: driver.getDataValue('name'),
                        phone: driver.getDataValue('phone'),
                        current_location: driverLocation,
                        service_center_id: driver.getDataValue('service_center_id'),
                        hub_id: driver.getDataValue('hub_id'),
                        current_tasks: totalCurrentTasks,
                        distance_from_order: distance,
                        is_available: true
                    });
                }
            }

            // 5. Sort berdasarkan jarak terdekat dan beban kerja
            availableDrivers.sort((a, b) => {
                if (a.current_tasks !== b.current_tasks) {
                    return a.current_tasks - b.current_tasks; // Prioritas beban kerja rendah
                }
                return a.distance_from_order - b.distance_from_order; // Kemudian jarak terdekat
            });

            return {
                message: `Ditemukan ${availableDrivers.length} kurir yang tersedia`,
                success: true,
                data: {
                    order_id: query.order_id,
                    order_location: orderLocation,
                    available_drivers: availableDrivers,
                    total_available: availableDrivers.length
                }
            };

        } catch (error) {
            this.logger.error(`Error in getAvailableDriversForPickup: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Mendapatkan daftar kurir yang tersedia untuk delivery berdasarkan order
     */
    async getAvailableDriversForDeliver(
        query: AvailableDriversForDeliverDto
    ): Promise<AvailableDriversResponseDto> {
        try {
            // 1. Ambil data order untuk mendapatkan lokasi tujuan dan service center
            const order = await this.orderModel.findByPk(query.order_id, {
                attributes: [
                    'id',
                    'latlngTujuan',
                    'svc_dest_id',
                    'hub_dest_id',
                    'status',
                    'status_pickup'
                ]
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // Validasi status order - harus dalam status siap diantar
            const status = order.getDataValue('status');
            const statusPickup = order.getDataValue('status_pickup');

            if (status !== 'Out for Delivery' && status !== 'In Transit') {
                throw new BadRequestException('Order tidak dalam status yang dapat ditugaskan untuk delivery');
            }

            // 2. Parse lokasi tujuan order
            let orderLocation: DriverLocationDto = { lat: 0, lng: 0 };
            const latlngTujuan = order.getDataValue('latlngTujuan');
            if (latlngTujuan) {
                try {
                    // Handle format string langsung "lat,lng"
                    if (typeof latlngTujuan === 'string' && latlngTujuan.includes(',')) {
                        const [lat, lng] = latlngTujuan.split(',').map(coord => parseFloat(coord.trim()));
                        if (!isNaN(lat) && !isNaN(lng)) {
                            orderLocation = { lat, lng };
                        }
                    } else {
                        // Handle format JSON
                        const latlngData = JSON.parse(latlngTujuan);

                        // Handle format array of objects dengan field latlng
                        if (Array.isArray(latlngData) && latlngData.length > 0) {
                            // Ambil koordinat terakhir (lokasi tujuan)
                            const lastLocation = latlngData[latlngData.length - 1];
                            if (lastLocation.latlng) {
                                const [lat, lng] = lastLocation.latlng.split(',').map(coord => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    orderLocation = { lat, lng };
                                }
                            }
                        } else if (latlngData.lat && latlngData.lng) {
                            // Handle format object langsung {lat: x, lng: y}
                            orderLocation = { lat: latlngData.lat, lng: latlngData.lng };
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Invalid latlng format for order ${query.order_id}: ${latlngTujuan}`);
                }
            }

            const svcDestId = order.getDataValue('svc_dest_id');
            const hubDestId = order.getDataValue('hub_dest_id');

            // 3. Cari kurir yang memenuhi kriteria (level 4 = transporter)
            const driverWhereClause: any = {
                level: { [Op.eq]: 8 }, // Transporter level
                aktif: 1,
                status_app: 1,
                freeze_saldo: 0,
                freeze_gps: 0
            };

            // Filter berdasarkan service center atau hub tujuan
            if (query.hub_id) {
                driverWhereClause.hub_id = query.hub_id;
            } else if (svcDestId) {
                driverWhereClause.service_center_id = svcDestId;
            } else if (hubDestId) {
                driverWhereClause.hub_id = hubDestId;
            }

            const drivers = await this.userModel.findAll({
                where: driverWhereClause,
                attributes: [
                    'id',
                    'name',
                    'phone',
                    'latlng',
                    'service_center_id',
                    'hub_id'
                ]
            });

            // 4. Filter dan hitung beban kerja kurir
            const availableDrivers: AvailableDriverDto[] = [];

            for (const driver of drivers) {
                const driverId = driver.getDataValue('id');

                // Hitung tugas delivery yang sedang berjalan (status pending = 0)
                const currentDeliveryTasks = await this.orderDeliverDriverModel.count({
                    where: {
                        driver_id: driverId,
                        status: 0 // Status pending
                    }
                });

                // Hitung tugas pickup yang masih berjalan
                const currentPickupTasks = await this.orderPickupDriverModel.count({
                    where: {
                        driver_id: driverId,
                        status: 0 // Status pending
                    }
                });

                const totalCurrentTasks = currentPickupTasks + currentDeliveryTasks;

                // Kurir dianggap tersedia jika tugas < 3
                if (totalCurrentTasks < 3) {
                    // Parse lokasi kurir
                    let driverLocation: DriverLocationDto = { lat: 0, lng: 0 };
                    const driverLatlng = driver.getDataValue('latlng');
                    if (driverLatlng) {
                        try {
                            // Handle format string langsung "lat,lng"
                            if (typeof driverLatlng === 'string' && driverLatlng.includes(',')) {
                                const [lat, lng] = driverLatlng.split(',').map(coord => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    driverLocation = { lat, lng };
                                }
                            } else {
                                // Handle format JSON
                                const latlngData = JSON.parse(driverLatlng);

                                // Handle format array of objects dengan field latlng
                                if (Array.isArray(latlngData) && latlngData.length > 0) {
                                    // Ambil koordinat terakhir (lokasi saat ini)
                                    const lastLocation = latlngData[latlngData.length - 1];
                                    if (lastLocation.latlng) {
                                        const [lat, lng] = lastLocation.latlng.split(',').map(coord => parseFloat(coord.trim()));
                                        if (!isNaN(lat) && !isNaN(lng)) {
                                            driverLocation = { lat, lng };
                                        }
                                    }
                                } else if (latlngData.lat && latlngData.lng) {
                                    // Handle format object langsung {lat: x, lng: y}
                                    driverLocation = { lat: latlngData.lat, lng: latlngData.lng };
                                }
                            }
                        } catch (error) {
                            this.logger.warn(`Invalid latlng format for driver ${driverId}: ${driverLatlng}`);
                        }
                    }

                    // Hitung jarak dari order (simplified calculation)
                    let distance = 0;
                    if (orderLocation.lat && orderLocation.lng && driverLocation.lat && driverLocation.lng) {
                        distance = this.calculateDistance(
                            orderLocation.lat, orderLocation.lng,
                            driverLocation.lat, driverLocation.lng
                        );
                    }

                    availableDrivers.push({
                        id: driverId,
                        name: driver.getDataValue('name'),
                        phone: driver.getDataValue('phone'),
                        current_location: driverLocation,
                        service_center_id: driver.getDataValue('service_center_id'),
                        hub_id: driver.getDataValue('hub_id'),
                        current_tasks: totalCurrentTasks,
                        distance_from_order: distance,
                        is_available: true
                    });
                }
            }

            // 5. Sort berdasarkan jarak terdekat dan beban kerja
            availableDrivers.sort((a, b) => {
                if (a.current_tasks !== b.current_tasks) {
                    return a.current_tasks - b.current_tasks; // Prioritas beban kerja rendah
                }
                return a.distance_from_order - b.distance_from_order; // Kemudian jarak terdekat
            });

            return {
                message: `Ditemukan ${availableDrivers.length} kurir transporter yang tersedia untuk delivery`,
                success: true,
                data: {
                    order_id: query.order_id,
                    order_location: orderLocation,
                    available_drivers: availableDrivers,
                    total_available: availableDrivers.length
                }
            };

        } catch (error) {
            this.logger.error(`Error in getAvailableDriversForDeliver: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Helper function untuk menghitung jarak antara dua koordinat (Haversine formula)
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Radius bumi dalam kilometer
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Helper function untuk mengkonversi derajat ke radian
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Menugaskan driver untuk order (pickup atau delivery)
     */
    async assignDriverToOrder(
        assignDriverDto: AssignDriverDto
    ): Promise<AssignDriverResponseDto> {
        if (!this.orderModel.sequelize) {
            throw new InternalServerErrorException('Database connection tidak tersedia');
        }
        const transaction = await this.orderModel.sequelize.transaction();

        try {
            // 1. Validasi order
            const order = await this.orderModel.findByPk(assignDriverDto.order_id, {
                transaction
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // 2. Validasi driver
            const driver = await this.userModel.findByPk(assignDriverDto.driver_id, {
                transaction
            });

            if (!driver) {
                throw new NotFoundException('Driver tidak ditemukan');
            }

            const driverLevel = driver.getDataValue('level');
            if (driverLevel !== 8) {
                throw new BadRequestException('User yang dipilih bukan driver/kurir');
            }

            // 3. Validasi user yang melakukan penugasan
            const assignedByUser = await this.userModel.findByPk(assignDriverDto.assigned_by_user_id, {
                transaction
            });

            if (!assignedByUser) {
                throw new NotFoundException('User yang melakukan penugasan tidak ditemukan');
            }

            // 4. Validasi status order berdasarkan task_type
            if (assignDriverDto.task_type === 'pickup') {
                const statusPickup = order.getDataValue('status_pickup');
                const isGagalPickup = order.getDataValue('is_gagal_pickup');

                if ((statusPickup && statusPickup !== 'siap pickup') || isGagalPickup === 1) {
                    throw new BadRequestException('Order tidak dalam status yang dapat ditugaskan untuk pickup');
                }
            } else if (assignDriverDto.task_type === 'delivery') {
                const orderStatus = order.getDataValue('status');

                // Validasi order sudah sampai di hub tujuan dan siap untuk delivery
                if (orderStatus !== 'In Transit' && orderStatus !== 'Out for Delivery') {
                    throw new BadRequestException('Order belum siap untuk delivery. Status saat ini: ' + orderStatus);
                }
            }

            // 5. Update order berdasarkan task_type
            if (assignDriverDto.task_type === 'pickup') {
                await this.orderModel.update(
                    {
                        assign_driver: assignDriverDto.driver_id,
                        pickup_by: driver.getDataValue('name'),
                        status_pickup: ORDER_STATUS.PICKED_UP,
                        status: ORDER_STATUS.PICKED_UP,
                        updatedAt: new Date()
                    },
                    {
                        where: { id: assignDriverDto.order_id },
                        transaction
                    }
                );
            } else if (assignDriverDto.task_type === 'delivery') {
                await this.orderModel.update(
                    {
                        deliver_by: assignDriverDto.driver_id,
                        status: ORDER_STATUS.OUT_FOR_DELIVERY,
                        updatedAt: new Date()
                    },
                    {
                        where: { id: assignDriverDto.order_id },
                        transaction
                    }
                );
            }

            // 6. Buat record di tabel yang sesuai berdasarkan task_type
            if (assignDriverDto.task_type === 'pickup') {
                // Buat record di order_pickup_drivers
                await this.orderPickupDriverModel.create({
                    order_id: assignDriverDto.order_id,
                    driver_id: assignDriverDto.driver_id,
                    assign_date: new Date(),
                    name: driver.getDataValue('name'),
                    status: 0, // pending
                    photo: '', // default empty string untuk field wajib
                    notes: '', // default empty string untuk field wajib
                    signature: '' // default empty string untuk field wajib
                } as any, { transaction });
            } else if (assignDriverDto.task_type === 'delivery') {
                // Buat record di order_deliver_drivers
                await this.orderDeliverDriverModel.create({
                    order_id: assignDriverDto.order_id,
                    driver_id: assignDriverDto.driver_id,
                    assign_date: new Date(),
                    name: driver.getDataValue('name'),
                    status: 0, // pending
                    photo: '', // default empty string untuk field wajib
                    notes: '', // default empty string untuk field wajib
                    signature: '' // default empty string untuk field wajib
                }, { transaction });
            }

            // Buat notification badge untuk order baru
            const menuName = assignDriverDto.task_type === 'pickup' ? 'Reweight' : 'Order Ditugaskan';
            await this.createNotificationBadge(assignDriverDto.order_id, menuName, 'order');

            // Mark as read berdasarkan menuName
            if (menuName === 'Reweight') {
                // Jika Reweight, mark Order Masuk sebagai read
                await this.markOrderMasukAsRead(assignDriverDto.order_id);
            } else if (menuName === 'Order Ditugaskan') {
                // Jika Order Ditugaskan, mark Order kirim sebagai read
                await this.markOrderKirimAsRead(assignDriverDto.order_id);
            }

            // 7. Catat di order histories
            const historyStatus = assignDriverDto.task_type === 'pickup'
                ? 'Driver Assigned for Pickup'
                : 'Driver Assigned for Delivery';

            // Set remarks berdasarkan task_type
            let historyRemark: string;
            if (assignDriverDto.task_type === 'pickup') {
                historyRemark = 'Kurir dalam perjalanan';
            } else if (assignDriverDto.task_type === 'delivery') {
                historyRemark = 'Kiriman dibawa oleh kurir';
            } else {
                historyRemark = `Order ditugaskan kepada ${driver.getDataValue('name')} untuk tugas ${assignDriverDto.task_type}`;
            }

            // Buat order history dengan format tanggal dan waktu yang benar
            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: assignDriverDto.order_id,
                status: historyStatus,
                remark: historyRemark,
                date: date,
                time: time,
                created_by: assignDriverDto.assigned_by_user_id,
                created_at: new Date(),
                provinsi: '', // default empty string untuk field wajib
                kota: ''     // default empty string untuk field wajib
            }, { transaction });

            const driverPhone = driver.getDataValue('phone');
            const driverName = driver.getDataValue('name');
            const assignerName = assignedByUser.getDataValue('name');
            const orderTracking = order.getDataValue('no_tracking');

            // 8. Commit transaction
            await transaction.commit();

            // Pengiriman WhatsApp ke driver saat penugasan dimatikan sesuai permintaan
            // await this.sendDriverAssignmentWhatsapp({
            //     phone: driverPhone,
            //     driverName,
            //     taskType: assignDriverDto.task_type,
            //     orderId: order.getDataValue('id'),
            //     orderTracking,
            //     assignerName,
            // });

            return {
                message: `Kurir berhasil ditugaskan untuk ${assignDriverDto.task_type}`,
                success: true,
                data: {
                    order_id: assignDriverDto.order_id,
                    driver_id: assignDriverDto.driver_id,
                    driver_name: driver.getDataValue('name'),
                    task_type: assignDriverDto.task_type,
                    assigned_at: new Date().toISOString(),
                    assigned_by: assignedByUser.getDataValue('name')
                }
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error in assignDriverToOrder: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Menghitung driver statistics untuk hub tertentu
     */
    async calculateDriverStatisticsForHub(hub_id?: number): Promise<{
        kurir_available: number;
        total_kurir: number;
        dalam_pengiriman: number;
        dalam_penjemputan: number;
    }> {
        try {
            // Buat filter area untuk driver berdasarkan hub_id
            let driverAreaFilter = {};
            if (hub_id) {
                driverAreaFilter = {
                    hub_id: hub_id
                };
            }

            // 1. Total kurir (driver aktif dalam area)
            const totalKurir = await this.userModel.count({
                where: {
                    [Op.and]: [
                        driverAreaFilter,
                        { level: 8 }, // Level driver/kurir
                        { aktif: 1 }  // Driver aktif
                    ]
                }
            });

            // 2. Kurir available (driver online dalam 30 menit terakhir)
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const kurirAvailable = await this.userModel.count({
                where: {
                    [Op.and]: [
                        driverAreaFilter,
                        { level: 8 },
                        { aktif: 1 },
                        { last_update_gps: { [Op.gte]: thirtyMinutesAgo } }
                    ]
                }
            });

            // 3. Driver dalam penjemputan (mempunyai tugas pickup aktif)
            // Ambil semua driver dalam area, lalu hitung yang mempunyai tugas pickup aktif
            const driversInArea = await this.userModel.findAll({
                where: {
                    [Op.and]: [
                        driverAreaFilter,
                        { level: 8 },
                        { aktif: 1 }
                    ]
                },
                attributes: ['id']
            });

            let dalamPenjemputan = 0;
            let dalamPengiriman = 0;

            for (const driver of driversInArea) {
                const driverId = driver.getDataValue('id');

                // Cek apakah driver mempunyai tugas pickup aktif
                const pickupTasks = await this.orderModel.count({
                    where: {
                        assign_driver: driverId,
                        status_pickup: { [Op.in]: ['Assigned', 'Picked Up'] }
                    }
                });

                if (pickupTasks > 0) {
                    dalamPenjemputan++;
                }

                // Cek apakah driver mempunyai tugas delivery aktif
                const deliveryTasks = await this.orderModel.count({
                    where: {
                        deliver_by: driverId.toString(),
                        status: { [Op.in]: ['In Transit', 'Out for Delivery'] }
                    }
                });

                if (deliveryTasks > 0) {
                    dalamPengiriman++;
                }
            }

            return {
                kurir_available: kurirAvailable,
                total_kurir: totalKurir,
                dalam_pengiriman: dalamPengiriman,
                dalam_penjemputan: dalamPenjemputan
            };

        } catch (error) {
            this.logger.error(`Error calculating driver statistics for hub: ${error.message}`, error.stack);
            // Return default values jika ada error
            return {
                kurir_available: 0,
                total_kurir: 0,
                dalam_pengiriman: 0,
                dalam_penjemputan: 0
            };
        }
    }

    /**
     * Menghitung driver statistics untuk dashboard OPS (untuk orders service)
     */
    async calculateDriverStatistics(areaFilter: any): Promise<{
        kurir_available: number;
        total_kurir: number;
        dalam_pengiriman: number;
        dalam_penjemputan: number;
    }> {
        try {
            // Buat filter area untuk driver berdasarkan hub_id
            let driverAreaFilter = {};
            if (areaFilter[Op.or]) {
                const hubIds: number[] = [];
                for (const condition of areaFilter[Op.or] as any[]) {
                    if (condition.hub_source_id) hubIds.push(condition.hub_source_id);
                    if (condition.hub_dest_id) hubIds.push(condition.hub_dest_id);
                    if (condition.current_hub) hubIds.push(condition.current_hub);
                }
                if (hubIds.length > 0) {
                    driverAreaFilter = {
                        hub_id: { [Op.in]: hubIds }
                    };
                }
            }

            // 1. Total kurir (driver aktif dalam area)
            const totalKurir = await this.userModel.count({
                where: {
                    [Op.and]: [
                        driverAreaFilter,
                        { level: 8 }, // Level driver/kurir
                        { aktif: 1 }  // Driver aktif
                    ]
                }
            });

            // 2. Kurir available (driver online dalam 30 menit terakhir)
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const kurirAvailable = await this.userModel.count({
                where: {
                    [Op.and]: [
                        driverAreaFilter,
                        { level: 8 },
                        { aktif: 1 },
                        { last_update_gps: { [Op.gte]: thirtyMinutesAgo } }
                    ]
                }
            });

            // 3. Driver dalam penjemputan (mempunyai tugas pickup aktif)
            // Ambil semua driver dalam area, lalu hitung yang mempunyai tugas pickup aktif
            const driversInArea = await this.userModel.findAll({
                where: {
                    [Op.and]: [
                        driverAreaFilter,
                        { level: 8 },
                        { aktif: 1 }
                    ]
                },
                attributes: ['id']
            });

            let dalamPenjemputan = 0;
            let dalamPengiriman = 0;

            for (const driver of driversInArea) {
                const driverId = driver.getDataValue('id');

                // Cek apakah driver mempunyai tugas pickup aktif
                const pickupTasks = await this.orderModel.count({
                    where: {
                        assign_driver: driverId,
                        status_pickup: { [Op.in]: ['Assigned', 'Picked Up'] }
                    }
                });

                if (pickupTasks > 0) {
                    dalamPenjemputan++;
                }

                // Cek apakah driver mempunyai tugas delivery aktif
                const deliveryTasks = await this.orderModel.count({
                    where: {
                        deliver_by: driverId.toString(),
                        status: { [Op.in]: ['In Transit', 'Out for Delivery'] }
                    }
                });

                if (deliveryTasks > 0) {
                    dalamPengiriman++;
                }
            }

            return {
                kurir_available: kurirAvailable,
                total_kurir: totalKurir,
                dalam_pengiriman: dalamPengiriman,
                dalam_penjemputan: dalamPenjemputan
            };

        } catch (error) {
            this.logger.error(`Error calculating driver statistics: ${error.message}`, error.stack);
            // Return default values jika ada error
            return {
                kurir_available: 0,
                total_kurir: 0,
                dalam_pengiriman: 0,
                dalam_penjemputan: 0
            };
        }
    }

    /**
     * Helper method untuk membuat notification badge
     */
    private async createNotificationBadge(
        orderId: number,
        menuName: string,
        itemType: string = 'order'
    ): Promise<void> {
        try {
            // Dapatkan user yang relevan untuk notifikasi (ops team, admin, dll)
            const opsUsers = await this.userModel.findAll({
                where: {
                    [Op.or]: [
                        { level: 3 }, // Admin
                        { level: 6 }, // finance
                        { level: 7 }, // Ops
                        { level: 9 }, // traffic
                    ]
                },
                attributes: ['id'],
                raw: true,
            });

            const userIds = opsUsers.map(user => user.id);

            if (userIds.length > 0) {
                // Ambil hub_id dari order berdasarkan jenis notification
                const order = await this.orderModel.findByPk(orderId, {
                    attributes: ['hub_source_id', 'hub_dest_id', 'current_hub', 'next_hub'],
                    raw: true
                });

                let hubId = 0;
                if (menuName === 'Order Masuk') {
                    hubId = order?.hub_source_id || 0;
                } else if (menuName === 'Dalam pengiriman') {
                    hubId = order?.hub_source_id || 0;
                } else if (menuName === 'Order kirim') {
                    hubId = Number(order?.next_hub) || order?.hub_dest_id || 0;
                } else {
                    hubId = order?.hub_source_id || order?.hub_dest_id || 0;
                }

                await this.notificationBadgesService.createNotificationBadgeForHub(
                    menuName,
                    orderId,
                    itemType,
                    hubId
                );
            }
        } catch (error) {
            this.logger.error(`Error creating ${menuName} notification for order ${orderId}: ${error.message}`);
        }
    }

    /**
     * Helper method untuk menandai notification "Order Masuk" sebagai sudah dibaca
     */
    private async markOrderMasukAsRead(orderId: number): Promise<void> {
        try {
            await this.notificationBadgesService.markOrderMasukAsRead(orderId);
        } catch (error) {
            this.logger.error(`Error marking Order Masuk as read for order ${orderId}: ${error.message}`);
        }
    }

    /**
     * Helper method untuk menandai notification "Order kirim" sebagai sudah dibaca
     */
    private async markOrderKirimAsRead(orderId: number): Promise<void> {
        try {
            await this.notificationBadgesService.markOrderKirimAsRead(orderId);
        } catch (error) {
            this.logger.error(`Error marking Order kirim as read for order ${orderId}: ${error.message}`);
        }
    }

    /**
     * Mendapatkan daftar task (pickup dan delivery) untuk driver yang sedang login
     */
    async getMyTasks(driverId: number, query: MyTasksQueryDto): Promise<MyTasksResponseDto> {
        try {
            const {
                task_type = 'all',
                status,
                date_from,
                date_to,
                page = 1,
                limit = 20,
            } = query;

            const offset = (page - 1) * limit;

            // Build filter untuk status
            // Status mapping:
            // 0 = Pending
            // 1 = Completed (untuk pickup/delivery yang selesai)
            // 2 = Failed
            // 'completed' = Selesai dengan bukti foto (status = 1 dan photo tidak kosong)
            const statusFilter: any = {};
            const isCompletedFilter = status === 'completed';

            if (status !== undefined && !isCompletedFilter) {
                statusFilter.status = parseInt(status);
            }

            // Build filter untuk tanggal
            const dateFilter: any = {};
            if (date_from || date_to) {
                dateFilter.assign_date = {};
                if (date_from) {
                    dateFilter.assign_date[Op.gte] = new Date(date_from);
                }
                if (date_to) {
                    const endDate = new Date(date_to);
                    endDate.setHours(23, 59, 59, 999);
                    dateFilter.assign_date[Op.lte] = endDate;
                }
            }

            const tasks: DriverTaskDto[] = [];

            // 1. Ambil pickup tasks jika task_type adalah 'pickup' atau 'all'
            if (task_type === 'pickup' || task_type === 'all') {
                const pickupWhere: any = {
                    driver_id: driverId,
                };

                // Gabungkan dateFilter jika ada
                if (Object.keys(dateFilter).length > 0) {
                    Object.assign(pickupWhere, dateFilter);
                }

                // Filter untuk task selesai (completed): status = 1
                // Filter photo akan dilakukan setelah query untuk memastikan photo tidak kosong
                if (isCompletedFilter) {
                    pickupWhere.status = 1; // Completed
                } else if (status !== undefined) {
                    pickupWhere.status = parseInt(status);
                }

                const pickupTasks = await this.orderPickupDriverModel.findAll({
                    where: pickupWhere,
                    attributes: ['id', 'order_id', 'status', 'assign_date', 'notes', 'latlng', 'photo'],
                    raw: true,
                });

                // Filter tambahan: untuk task selesai, pastikan photo tidak kosong
                let filteredPickupTasks = pickupTasks;
                if (isCompletedFilter) {
                    filteredPickupTasks = pickupTasks.filter((task: any) => {
                        const photo = task.photo;
                        return photo && photo !== '' && photo !== null;
                    });
                }

                if (filteredPickupTasks.length > 0) {
                    // Ambil order_ids
                    const orderIds = filteredPickupTasks.map((task: any) => task.order_id);

                    // Query orders dengan filter tambahan untuk task selesai
                    const orderWhere: any = {
                        id: { [Op.in]: orderIds },
                    };

                    // Untuk task selesai (completed dengan foto), pastikan status_pickup = 'Completed'
                    if (isCompletedFilter) {
                        orderWhere.status_pickup = 'Completed';
                    } else if (status !== undefined && parseInt(status) === 1) {
                        // Untuk status = 1 (In Progress/Completed task), pastikan status_pickup != 'Completed' atau status_pickup = null
                        orderWhere.status_pickup = {
                            [Op.or]: [
                                { [Op.ne]: 'Completed' },
                                { [Op.is]: null }
                            ]
                        };
                    }

                    const orders = await this.orderModel.findAll({
                        where: orderWhere,
                        attributes: [
                            'id',
                            'no_tracking',
                            'nama_pengirim',
                            'alamat_pengirim',
                            'kota_pengirim',
                            'no_telepon_pengirim',
                            'nama_penerima',
                            'alamat_penerima',
                            'kota_penerima',
                            'no_telepon_penerima',
                            'nama_barang',
                            'reweight_status',
                            'layanan',
                            'hub_source_id',
                            'status_pickup',
                        ],
                        raw: true,
                    });

                    // Filter pickup tasks berdasarkan order status jika filter completed
                    // Hanya ambil task yang order status_pickup = 'Completed' untuk task selesai
                    if (isCompletedFilter) {
                        const completedOrderIds = orders
                            .filter((order: any) => order.status_pickup === 'Completed')
                            .map((order: any) => order.id);
                        filteredPickupTasks = filteredPickupTasks.filter((task: any) =>
                            completedOrderIds.includes(task.order_id)
                        );
                    }

                    // Buat map untuk akses cepat
                    const orderMap = new Map(orders.map((order: any) => [order.id, order]));

                    // Ambil semua hub_source_id yang unik
                    const hubSourceIds = [...new Set(orders.map((order: any) => order.hub_source_id).filter(Boolean))];

                    // Query hubs sekaligus
                    const hubs = await this.hubModel.findAll({
                        where: {
                            id: { [Op.in]: hubSourceIds },
                        },
                        attributes: ['id', 'nama'],
                        raw: true,
                    });

                    const hubMap = new Map(hubs.map((hub: any) => [hub.id, hub.nama]));

                    // Ambil informasi barang untuk semua orders sekaligus
                    const validPickupOrderIds = new Set(filteredPickupTasks.map((task: any) => task.order_id));
                    const orderIdsForPickup = orders
                        .filter((order: any) => validPickupOrderIds.has(order.id))
                        .map((order: any) => order.id);
                    const barangInfoMap = await this.getBarangInfoForOrders(orderIdsForPickup);

                    // Transform pickup tasks
                    for (const pickupTask of filteredPickupTasks) {
                        const order = orderMap.get(pickupTask.order_id);
                        if (!order || !validPickupOrderIds.has(order.id)) continue;

                        const hubName = hubMap.get(order.hub_source_id);
                        const statusLabel = this.getTaskStatusLabel(pickupTask.status, 'pickup', order.status_pickup);
                        const barangInfo = barangInfoMap.get(order.id);

                        tasks.push({
                            task_id: pickupTask.id,
                            task_type: 'pickup',
                            order_id: order.id,
                            no_tracking: order.no_tracking,
                            nama_pengirim: order.nama_pengirim,
                            alamat_pengirim: order.alamat_pengirim,
                            kota_pengirim: order.kota_pengirim,
                            no_telepon_pengirim: order.no_telepon_pengirim,
                            nama_penerima: order.nama_penerima,
                            alamat_penerima: order.alamat_penerima,
                            kota_penerima: order.kota_penerima,
                            no_telepon_penerima: order.no_telepon_penerima,
                            status: pickupTask.status,
                            reweight_status: order.reweight_status,
                            status_label: statusLabel,
                            assign_date: pickupTask.assign_date,
                            notes: pickupTask.notes || undefined,
                            latlng: pickupTask.latlng || undefined,
                            nama_barang: order.nama_barang || undefined,
                            layanan: order.layanan || undefined,
                            hub_name: hubName,
                            barang_info: barangInfo,
                        });
                    }
                }
            }

            // 2. Ambil delivery tasks jika task_type adalah 'delivery' atau 'all'
            if (task_type === 'delivery' || task_type === 'all') {
                const deliveryWhere: any = {
                    driver_id: driverId,
                };

                // Gabungkan dateFilter jika ada
                if (Object.keys(dateFilter).length > 0) {
                    Object.assign(deliveryWhere, dateFilter);
                }

                // Filter untuk task selesai (completed): status = 1
                // Filter photo akan dilakukan setelah query untuk memastikan photo tidak kosong
                if (isCompletedFilter) {
                    deliveryWhere.status = 1; // Completed
                } else if (status !== undefined) {
                    deliveryWhere.status = parseInt(status);
                }

                const deliveryTasks = await this.orderDeliverDriverModel.findAll({
                    where: deliveryWhere,
                    attributes: ['id', 'order_id', 'status', 'assign_date', 'notes', 'latlng', 'photo'],
                    raw: true,
                });

                if (deliveryTasks.length > 0) {
                    // Ambil order_ids
                    const orderIds = deliveryTasks.map((task: any) => task.order_id);

                    // Query orders dengan filter tambahan untuk task selesai
                    const orderWhere: any = {
                        id: { [Op.in]: orderIds },
                    };

                    // Untuk task selesai (completed dengan foto), pastikan status_deliver = 'Completed'
                    if (isCompletedFilter) {
                        orderWhere.status_deliver = 'Completed';
                    } else if (status !== undefined && parseInt(status) === 1) {
                        // Untuk status = 1 (In Progress/Completed task), pastikan status_deliver != 'Completed' atau status_deliver = null
                        orderWhere.status_deliver = {
                            [Op.or]: [
                                { [Op.ne]: 'Completed' },
                                { [Op.is]: null }
                            ]
                        };
                    }

                    const orders = await this.orderModel.findAll({
                        where: orderWhere,
                        attributes: [
                            'id',
                            'no_tracking',
                            'nama_pengirim',
                            'alamat_pengirim',
                            'kota_pengirim',
                            'no_telepon_pengirim',
                            'nama_penerima',
                            'alamat_penerima',
                            'kota_penerima',
                            'no_telepon_penerima',
                            'nama_barang',
                            'layanan',
                            'hub_dest_id',
                            'status',
                            'status_deliver',
                            'reweight_status',
                        ],
                        raw: true,
                    });

                    // Filter tambahan: untuk task selesai, pastikan photo tidak kosong
                    let filteredDeliveryTasks = deliveryTasks;
                    if (isCompletedFilter) {
                        filteredDeliveryTasks = deliveryTasks.filter((task: any) => {
                            const photo = task.photo;
                            return photo && photo !== '' && photo !== null;
                        });

                        // Filter delivery tasks berdasarkan order status jika filter completed
                        // Hanya ambil task yang order status_deliver = 'Completed' untuk task selesai
                        const deliveredOrderIds = orders
                            .filter((order: any) => order.status_deliver === 'Completed')
                            .map((order: any) => order.id);
                        filteredDeliveryTasks = filteredDeliveryTasks.filter((task: any) =>
                            deliveredOrderIds.includes(task.order_id)
                        );
                    }

                    // Buat map untuk akses cepat
                    const orderMap = new Map(orders.map((order: any) => [order.id, order]));

                    // Ambil semua hub_dest_id yang unik
                    const hubDestIds = [...new Set(orders.map((order: any) => order.hub_dest_id).filter(Boolean))];

                    // Query hubs sekaligus
                    const hubs = hubDestIds.length > 0 ? await this.hubModel.findAll({
                        where: {
                            id: { [Op.in]: hubDestIds },
                        },
                        attributes: ['id', 'nama'],
                        raw: true,
                    }) : [];

                    const hubMap = new Map(hubs.map((hub: any) => [hub.id, hub.nama]));

                    // Ambil informasi barang untuk semua orders sekaligus
                    const validDeliveryOrderIds = new Set(filteredDeliveryTasks.map((task: any) => task.order_id));
                    const orderIdsForDelivery = orders
                        .filter((order: any) => validDeliveryOrderIds.has(order.id))
                        .map((order: any) => order.id);
                    const barangInfoMap = await this.getBarangInfoForOrders(orderIdsForDelivery);

                    // Transform delivery tasks
                    for (const deliveryTask of filteredDeliveryTasks) {
                        const order = orderMap.get(deliveryTask.order_id);
                        if (!order || !validDeliveryOrderIds.has(order.id)) continue;

                        const hubName = hubMap.get(order.hub_dest_id);
                        const statusLabel = this.getTaskStatusLabel(deliveryTask.status, 'delivery', order.status_deliver);
                        const barangInfo = barangInfoMap.get(order.id);

                        tasks.push({
                            task_id: deliveryTask.id,
                            task_type: 'delivery',
                            order_id: order.id,
                            no_tracking: order.no_tracking,
                            nama_pengirim: order.nama_pengirim,
                            alamat_pengirim: order.alamat_pengirim,
                            kota_pengirim: order.kota_pengirim,
                            no_telepon_pengirim: order.no_telepon_pengirim,
                            nama_penerima: order.nama_penerima,
                            alamat_penerima: order.alamat_penerima,
                            kota_penerima: order.kota_penerima,
                            no_telepon_penerima: order.no_telepon_penerima,
                            status: deliveryTask.status,
                            reweight_status: order.reweight_status,
                            status_label: statusLabel,
                            assign_date: deliveryTask.assign_date,
                            notes: deliveryTask.notes || undefined,
                            latlng: deliveryTask.latlng || undefined,
                            nama_barang: order.nama_barang || undefined,
                            layanan: order.layanan || undefined,
                            hub_name: hubName,
                            barang_info: barangInfo,
                        });
                    }
                }
            }

            // Sort berdasarkan assign_date (terbaru dulu)
            tasks.sort((a, b) => {
                return new Date(b.assign_date).getTime() - new Date(a.assign_date).getTime();
            });

            // Pagination
            const total = tasks.length;
            const paginatedTasks = tasks.slice(offset, offset + limit);
            const totalPages = Math.ceil(total / limit);

            // Hitung statistik tugas (tanpa filter pagination, tapi tetap mengikuti filter tanggal)
            const statistics = await this.calculateTaskStatistics(driverId, date_from, date_to);

            return {
                message: 'Daftar task berhasil diambil',
                success: true,
                data: {
                    tasks: paginatedTasks,
                    pagination: {
                        page,
                        limit,
                        total,
                        total_pages: totalPages,
                    },
                    statistics,
                },
            };
        } catch (error) {
            this.logger.error(`Error in getMyTasks: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Gagal mengambil daftar task');
        }
    }

    /**
     * Menghitung statistik tugas untuk driver
     */
    private async calculateTaskStatistics(driverId: number, dateFrom?: string, dateTo?: string): Promise<TaskStatisticsDto> {
        try {
            // Build filter untuk tanggal
            const dateFilter: any = {};
            if (dateFrom || dateTo) {
                dateFilter.assign_date = {};
                if (dateFrom) {
                    dateFilter.assign_date[Op.gte] = new Date(dateFrom);
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    dateFilter.assign_date[Op.lte] = endDate;
                }
            }

            // Query semua pickup tasks
            const pickupWhere: any = {
                driver_id: driverId,
            };
            if (Object.keys(dateFilter).length > 0) {
                Object.assign(pickupWhere, dateFilter);
            }

            const allPickupTasks = await this.orderPickupDriverModel.findAll({
                where: pickupWhere,
                attributes: ['id', 'order_id', 'status', 'photo'],
                raw: true,
            });

            // Query semua delivery tasks
            const deliveryWhere: any = {
                driver_id: driverId,
            };
            if (Object.keys(dateFilter).length > 0) {
                Object.assign(deliveryWhere, dateFilter);
            }

            const allDeliveryTasks = await this.orderDeliverDriverModel.findAll({
                where: deliveryWhere,
                attributes: ['id', 'order_id', 'status', 'photo'],
                raw: true,
            });

            // Ambil order_ids untuk query orders
            const pickupOrderIds = allPickupTasks.map((task: any) => task.order_id);
            const deliveryOrderIds = allDeliveryTasks.map((task: any) => task.order_id);
            const allOrderIds = [...new Set([...pickupOrderIds, ...deliveryOrderIds])];

            // Query orders untuk mendapatkan status_pickup dan status_deliver
            const orders = allOrderIds.length > 0 ? await this.orderModel.findAll({
                where: {
                    id: { [Op.in]: allOrderIds },
                },
                attributes: ['id', 'status_pickup', 'status_deliver'],
                raw: true,
            }) : [];

            const orderMap = new Map(orders.map((order: any) => [order.id, order]));

            // Hitung statistik
            let totalTasks = 0;
            let totalPickup = allPickupTasks.length;
            let totalDelivery = allDeliveryTasks.length;
            let pending = 0;
            let inProgress = 0;
            let completed = 0;
            let failed = 0;
            let completedPickup = 0;
            let completedDelivery = 0;

            // Hitung statistik pickup tasks
            for (const pickupTask of allPickupTasks) {
                const order = orderMap.get(pickupTask.order_id);
                const photo = pickupTask.photo;
                const hasPhoto = photo && photo !== '' && photo !== null;
                const isOrderCompleted = order && order.status_pickup === 'Completed';

                if (pickupTask.status === 0) {
                    pending++;
                } else if (pickupTask.status === 1) {
                    if (isOrderCompleted && hasPhoto) {
                        completed++;
                        completedPickup++;
                    } else {
                        inProgress++;
                    }
                } else if (pickupTask.status === 2) {
                    failed++;
                }
            }

            // Hitung statistik delivery tasks
            for (const deliveryTask of allDeliveryTasks) {
                const order = orderMap.get(deliveryTask.order_id);
                const photo = deliveryTask.photo;
                const hasPhoto = photo && photo !== '' && photo !== null;
                const isOrderCompleted = order && order.status_deliver === 'Completed';

                if (deliveryTask.status === 0) {
                    pending++;
                } else if (deliveryTask.status === 1) {
                    if (isOrderCompleted && hasPhoto) {
                        completed++;
                        completedDelivery++;
                    } else {
                        inProgress++;
                    }
                } else if (deliveryTask.status === 2) {
                    failed++;
                }
            }

            totalTasks = totalPickup + totalDelivery;

            return {
                total_tasks: totalTasks,
                total_pickup: totalPickup,
                total_delivery: totalDelivery,
                pending,
                in_progress: inProgress,
                completed,
                failed,
                completed_pickup: completedPickup,
                completed_delivery: completedDelivery,
            };
        } catch (error) {
            this.logger.error(`Error in calculateTaskStatistics: ${error.message}`, error.stack);
            // Return default statistics jika error
            return {
                total_tasks: 0,
                total_pickup: 0,
                total_delivery: 0,
                pending: 0,
                in_progress: 0,
                completed: 0,
                failed: 0,
                completed_pickup: 0,
                completed_delivery: 0,
            };
        }
    }

    /**
     * Helper method untuk mendapatkan label status task
     * Status mapping berdasarkan confirmPickup:
     * 0 = Pending (baru ditugaskan)
     * 1 = Completed (selesai dengan bukti foto)
     * 2 = Failed (gagal)
     */
    private getTaskStatusLabel(status: number, taskType?: 'pickup' | 'delivery', orderStatus?: string): string {
        switch (status) {
            case 0:
                return 'Pending';
            case 1:
                // Untuk pickup tasks, cek status_pickup untuk menentukan label
                if (taskType === 'pickup' && orderStatus !== undefined) {
                    if (orderStatus === 'Completed') {
                        return 'Completed';
                    } else {
                        return 'In Progress';
                    }
                }
                // Untuk delivery tasks, cek status_deliver untuk menentukan label
                if (taskType === 'delivery' && orderStatus !== undefined) {
                    if (orderStatus === 'Completed') {
                        return 'Completed';
                    } else {
                        return 'In Progress';
                    }
                }
                // Default untuk status = 1
                return 'Completed';
            case 2:
                return 'Failed';
            default:
                return 'Unknown';
        }
    }

    /**
     * Helper method untuk mendapatkan informasi barang (jumlah koli, total berat, detail koli) untuk multiple orders
     */
    private async getBarangInfoForOrders(orderIds: number[]): Promise<Map<number, { jumlah_koli: number; total_berat_kg: number; detail_koli?: Array<{ piece_id: string; berat: number; panjang: number; lebar: number; tinggi: number }> }>> {
        const barangInfoMap = new Map<number, { jumlah_koli: number; total_berat_kg: number; detail_koli?: Array<{ piece_id: string; berat: number; panjang: number; lebar: number; tinggi: number }> }>();

        if (orderIds.length === 0) {
            return barangInfoMap;
        }

        try {
            // Ambil semua pieces untuk orders tersebut
            const pieces = await this.orderPieceModel.findAll({
                where: {
                    order_id: { [Op.in]: orderIds },
                },
                attributes: [
                    'id',
                    'order_id',
                    'piece_id',
                    'berat',
                    'panjang',
                    'lebar',
                    'tinggi',
                ],
                raw: true,
            });

            // Group pieces by order_id
            const piecesByOrder = new Map<number, any[]>();
            for (const piece of pieces) {
                const orderId = (piece as any).order_id;
                if (!piecesByOrder.has(orderId)) {
                    piecesByOrder.set(orderId, []);
                }
                piecesByOrder.get(orderId)!.push(piece);
            }

            // Hitung jumlah koli dan total berat untuk setiap order
            for (const orderId of orderIds) {
                const orderPieces = piecesByOrder.get(orderId) || [];

                const jumlah_koli = orderPieces.length;
                const total_berat_kg = orderPieces.reduce((sum, piece: any) => {
                    return sum + (Number(piece.berat) || 0);
                }, 0);

                // Detail koli (ambil maksimal 10 koli pertama untuk menghindari response terlalu besar)
                const detail_koli = orderPieces.slice(0, 10).map((piece: any) => ({
                    id: piece.id || '',
                    piece_id: piece.piece_id || '',
                berat: Math.round((Number(piece.berat) || 0) * 100) / 100,
                panjang: Math.round((Number(piece.panjang) || 0) * 100) / 100,
                lebar: Math.round((Number(piece.lebar) || 0) * 100) / 100,
                tinggi: Math.round((Number(piece.tinggi) || 0) * 100) / 100,
                }));

                barangInfoMap.set(orderId, {
                jumlah_koli: Math.round(jumlah_koli * 100) / 100,
                    total_berat_kg: Number(total_berat_kg.toFixed(2)),
                    detail_koli: detail_koli.length > 0 ? detail_koli : undefined,
                });
            }
        } catch (error) {
            this.logger.error(`Error getting barang info for orders: ${error.message}`);
            // Return empty map on error, so the response still works
        }

        return barangInfoMap;
    }

    /**
     * Driver menerima tugas (pickup atau delivery)
     * Mengubah status task dari 0 (Pending) ke 1 (In Progress)
     */
    async acceptTask(taskId: number, driverId: number, taskType: 'pickup' | 'delivery'): Promise<AcceptTaskResponseDto> {
        if (!this.orderModel.sequelize) {
            throw new InternalServerErrorException('Database connection tidak tersedia');
        }

        const transaction = await this.orderModel.sequelize.transaction();

        try {
            if (taskType === 'pickup') {
                // 1. Cek apakah task adalah pickup task
                const pickupTask = await this.orderPickupDriverModel.findOne({
                    where: {
                        id: taskId,
                        driver_id: driverId,
                    },
                    transaction,
                });

                if (!pickupTask) {
                    throw new NotFoundException('Pickup task tidak ditemukan atau tidak memiliki akses untuk task ini');
                }

                // Validasi status task masih Pending (0)
                const currentStatus = pickupTask.getDataValue('status');
                if (currentStatus !== 0) {
                    throw new BadRequestException(`Task tidak dapat diterima karena status saat ini bukan Pending. Status saat ini: ${this.getTaskStatusLabel(currentStatus)}`);
                }

                // Update status menjadi In Progress (1)
                await this.orderPickupDriverModel.update(
                    {
                        status: 1, // In Progress
                    },
                    {
                        where: { id: taskId },
                        transaction,
                    }
                );

                // Ambil order information
                const orderId = pickupTask.getDataValue('order_id');
                const order = await this.orderModel.findByPk(orderId, {
                    attributes: ['id', 'no_tracking'],
                    transaction,
                });

                if (!order) {
                    throw new NotFoundException('Order tidak ditemukan');
                }

                await transaction.commit();

                return {
                    message: 'Task pickup berhasil diterima',
                    success: true,
                    data: {
                        task_id: taskId,
                        task_type: 'pickup',
                        order_id: orderId,
                        no_tracking: order.getDataValue('no_tracking'),
                        status: 1,
                        status_label: 'In Progress',
                        accepted_at: new Date(),
                    },
                };
            } else if (taskType === 'delivery') {
                // 2. Cek apakah task adalah delivery task
                const deliveryTask = await this.orderDeliverDriverModel.findOne({
                    where: {
                        id: taskId,
                        driver_id: driverId,
                    },
                    transaction,
                });

                if (!deliveryTask) {
                    throw new NotFoundException('Delivery task tidak ditemukan atau tidak memiliki akses untuk task ini');
                }

                // Validasi status task masih Pending (0)
                const currentStatus = deliveryTask.getDataValue('status');
                if (currentStatus !== 0) {
                    throw new BadRequestException(`Task tidak dapat diterima karena status saat ini bukan Pending. Status saat ini: ${this.getTaskStatusLabel(currentStatus)}`);
                }

                // Update status menjadi In Progress (1)
                await this.orderDeliverDriverModel.update(
                    {
                        status: 1, // In Progress
                    },
                    {
                        where: { id: taskId },
                        transaction,
                    }
                );

                // Ambil order information
                const orderId = deliveryTask.getDataValue('order_id');
                const order = await this.orderModel.findByPk(orderId, {
                    attributes: ['id', 'no_tracking'],
                    transaction,
                });

                if (!order) {
                    throw new NotFoundException('Order tidak ditemukan');
                }

                await transaction.commit();

                return {
                    message: 'Task delivery berhasil diterima',
                    success: true,
                    data: {
                        task_id: taskId,
                        task_type: 'delivery',
                        order_id: orderId,
                        no_tracking: order.getDataValue('no_tracking'),
                        status: 1,
                        status_label: 'In Progress',
                        accepted_at: new Date(),
                    },
                };
            } else {
                throw new BadRequestException('task_type tidak valid. Harus salah satu dari: pickup, delivery');
            }

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error in acceptTask: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Gagal menerima task');
        }
    }

    /**
     * Konfirmasi delivery task oleh driver
     * Mengupdate status delivery menjadi Completed atau Failed dengan bukti foto
     */
    async confirmDelivery(confirmDto: ConfirmDeliveryDto): Promise<{ message: string; success: boolean; data: any }> {
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

        // Validasi user_id
        if (!user_id) {
            throw new BadRequestException('User ID wajib diisi');
        }

        // Validasi status
        const isSuccess = status === 'success' || status === 'completed';
        const isFailed = status === 'failed' || status === 'cancelled';

        if (!isSuccess && !isFailed) {
            throw new BadRequestException('Status tidak valid. Harus salah satu dari: success, completed, failed, cancelled');
        }

        // Validasi reason untuk delivery gagal
        if (isFailed && !reason) {
            throw new BadRequestException('Alasan kegagalan wajib diisi untuk delivery yang gagal');
        }

        // Validasi order exists
        const order = await this.orderModel.findByPk(order_id);
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Validasi order sudah dalam status yang memungkinkan konfirmasi delivery
        const currentStatus = order.getDataValue('status');
        if (currentStatus === ORDER_STATUS.DELIVERED || currentStatus === ORDER_STATUS.CANCELLED) {
            throw new BadRequestException(`Order tidak dapat dikonfirmasi karena sudah dalam status: ${currentStatus}`);
        }

        // Validasi delivery task exists untuk driver ini
        const deliveryTask = await this.orderDeliverDriverModel.findOne({
            where: {
                order_id,
                driver_id: user_id,
            },
        });

        if (!deliveryTask) {
            throw new NotFoundException('Delivery task tidak ditemukan atau driver tidak memiliki akses untuk task ini');
        }

        // Mulai transaction
        if (!this.orderModel.sequelize) {
            throw new InternalServerErrorException('Database connection tidak tersedia');
        }

        const transaction = await this.orderModel.sequelize.transaction();

        try {
            const now = new Date();
            const deliveryStatus = isSuccess ? 'Completed' : 'Failed';
            const orderDeliveryStatus = isSuccess ? 1 : 2; // 1: Completed, 2: Failed

            // 1. Update orders table 
            if (isSuccess) {
                await this.orderModel.update(
                    {
                        status: ORDER_STATUS.DELIVERED,
                        status_deliver: deliveryStatus,
                        updated_at: now,
                    },
                    {
                        where: { id: order_id },
                        transaction,
                    }
                );
            } else {
                // Jika delivery gagal, hanya update status_deliver, jangan ubah status order
                await this.orderModel.update(
                    {
                        status_deliver: deliveryStatus,
                        updated_at: now,
                    },
                    {
                        where: { id: order_id },
                        transaction,
                    }
                );
            }


            // 2. Update order_deliver_drivers
            await this.orderDeliverDriverModel.update(
                {
                    status: orderDeliveryStatus,
                    photo: photo || '',
                    notes: notes || reason || '',
                    signature: signature || '',
                    latlng: latlng,
                    updated_at: now,
                } as any,
                {
                    where: { order_id, driver_id: user_id },
                    transaction,
                }
            );

            // 3. Update order_pieces jika delivery berhasil
            if (isSuccess) {
                await this.orderPieceModel.update(
                    {
                        deliver_status: 1, // Delivered
                        updatedAt: now,
                    },
                    {
                        where: { order_id },
                        transaction,
                    }
                );
            }

            await transaction.commit();

            return {
                message: `Delivery berhasil dikonfirmasi sebagai ${isSuccess ? 'berhasil' : 'gagal'}`,
                success: true,
                data: {
                    order_id,
                    status: isSuccess ? ORDER_STATUS.DELIVERED : ORDER_STATUS.OUT_FOR_DELIVERY,
                    task_status: orderDeliveryStatus,
                    confirmed_at: now,
                    confirmed_by: user_id,
                    location: latlng,
                    notes: notes || reason,
                },
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error in confirmDelivery: ${error.message}`, error.stack);

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Gagal mengkonfirmasi delivery');
        }
    }

    private normalizePhoneNumber(phone?: string | null): string | null {
        if (!phone) {
            return null;
        }

        let cleaned = phone.trim();
        if (!cleaned) {
            return null;
        }

        cleaned = cleaned.replace(/\s+/g, '');
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }

        cleaned = cleaned.replace(/[^0-9]/g, '');
        if (!cleaned) {
            return null;
        }

        if (cleaned.startsWith('62')) {
            return `+${cleaned}`;
        }

        if (cleaned.startsWith('0')) {
            return `+62${cleaned.substring(1)}`;
        }

        return `+62${cleaned}`;
    }

    private async sendDriverAssignmentWhatsapp(params: {
        phone?: string | null;
        driverName: string;
        taskType: 'pickup' | 'delivery';
        orderTracking?: string | null;
        orderId: number;
        assignerName: string;
    }): Promise<void> {
        const phoneNumber = this.normalizePhoneNumber(params.phone);

        if (!phoneNumber) {
            this.logger.warn(`Tidak dapat mengirim notifikasi WhatsApp: nomor telepon driver ${params.driverName} tidak valid atau kosong`);
            return;
        }

        const taskLabel = params.taskType === 'pickup' ? 'pickup' : 'delivery';
        const orderIdentifier = params.orderTracking && params.orderTracking.trim().length > 0
            ? params.orderTracking.trim()
            : `#${params.orderId}`;

        const message = `Halo ${params.driverName}, Anda baru saja ditugaskan untuk ${taskLabel} order ${orderIdentifier} oleh ${params.assignerName}. Mohon cek aplikasi GG Kurir untuk detail tugasnya. Terima kasih.`;

        try {
            await this.whatsappService.sendText({
                phoneNumber,
                message,
            });
            this.logger.log(`Notifikasi WhatsApp penugasan berhasil dikirim ke ${params.driverName} (${phoneNumber}) untuk ${taskLabel} order ${orderIdentifier}`);
        } catch (error: any) {
            const errMsg = error?.message || 'Unknown error';
            this.logger.error(`Gagal mengirim notifikasi WhatsApp ke ${params.driverName} (${phoneNumber}): ${errMsg}`, error?.stack);
        }
    }
} 