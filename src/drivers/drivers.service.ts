import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { User } from '../models/user.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';
import { LogGps } from '../models/log-gps.model';
import { Order } from '../models/order.model';
import { Hub } from '../models/hub.model';
import { AvailableDriversDto, AvailableDriversForPickupDto, AvailableDriversResponseDto, AvailableDriverDto, DriverLocationDto } from './dto/available-drivers.dto';
import { DriverStatusSummaryQueryDto, DriverStatusSummaryResponseDto, DriverStatusSummaryDto, DriverWorkloadDto } from './dto/driver-status-summary.dto';
import { AssignDriverDto, AssignDriverResponseDto } from './dto/assign-driver.dto';

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

        // Filter berdasarkan level driver (sesuaikan dengan level yang Anda definisikan)
        // Contoh: level 3 untuk driver
        whereCondition.level = 3;

        // Filter berdasarkan hub_id
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

    async getDriverStatusSummary(params: DriverStatusSummaryQueryDto): Promise<DriverStatusSummaryResponseDto> {
        const { hub_id, date = new Date().toISOString().split('T')[0], status } = params;

        // Build where condition untuk driver
        const whereCondition: any = {
            aktif: 1, // Driver aktif
            level: 8, // Level driver/kurir
        };

        // Filter berdasarkan hub_id
        if (hub_id) {
            whereCondition.hub_id = hub_id;
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

            // Tentukan status ketersediaan
            const statusKetersediaan: 'Sibuk' | 'Siap Menerima Tugas' =
                totalPendingTasks > 0 ? 'Sibuk' : 'Siap Menerima Tugas';

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
        const driverStatistics = await this.calculateDriverStatisticsForHub(hub_id);

        return {
            status: 'success',
            date: date,
            hub_id: hub_id,
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

            if ((statusPickup && statusPickup !== 'siap pickup') || isGagalPickup === 1) {
                throw new BadRequestException('Order tidak dalam status yang dapat ditugaskan untuk pickup');
            }

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
                        status_pickup: 'Assigned',
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
                        status: 'Out for Delivery',
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

            // 7. Catat di order histories
            const historyStatus = assignDriverDto.task_type === 'pickup'
                ? 'Driver Assigned for Pickup'
                : 'Driver Assigned for Delivery';

            const historyRemark = `Order ditugaskan kepada ${driver.getDataValue('name')} untuk tugas ${assignDriverDto.task_type}`;

            // Note: Perlu inject OrderHistory model jika diperlukan
            // await this.orderHistoryModel.create({...}, { transaction });

            // 8. Commit transaction
            await transaction.commit();

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
} 