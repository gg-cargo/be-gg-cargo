import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { User } from '../models/user.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { LogGps } from '../models/log-gps.model';
import { AvailableDriversDto } from './dto/available-drivers.dto';

@Injectable()
export class DriversService {
    constructor(
        @InjectModel(User)
        private userModel: typeof User,
        @InjectModel(OrderPickupDriver)
        private orderPickupDriverModel: typeof OrderPickupDriver,
        @InjectModel(LogGps)
        private logGpsModel: typeof LogGps,
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
} 