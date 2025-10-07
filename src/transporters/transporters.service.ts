import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../models/user.model';
import { TruckList } from '../models/truck-list.model';
import { JobAssign } from '../models/job-assign.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';
import { AvailableTransportersQueryDto, AvailableTransportersResponseDto } from './dto/available-transporters.dto';

@Injectable()
export class TransportersService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(TruckList) private readonly truckModel: typeof TruckList,
        @InjectModel(JobAssign) private readonly jobAssignModel: typeof JobAssign,
        @InjectModel(OrderPickupDriver) private readonly pickupModel: typeof OrderPickupDriver,
        @InjectModel(OrderDeliverDriver) private readonly deliverModel: typeof OrderDeliverDriver,
    ) { }

    async getAvailableTransporters(query: AvailableTransportersQueryDto): Promise<AvailableTransportersResponseDto> {
        if (!query.hub_id && !query.svc_id) {
            throw new BadRequestException('harus menyertakan hub_id atau svc_id');
        }

        // Kandidat transporter
        const whereUser: any = {
            level: 4,
            aktif: 1,
            status_app: 1,
            freeze_saldo: 0,
            freeze_gps: 0,
        };
        if (query.hub_id) whereUser.hub_id = query.hub_id;
        if (query.svc_id) whereUser.service_center_id = query.svc_id;

        // First get users without trucks to avoid join issues
        const users = await this.userModel.findAll({
            where: whereUser,
            attributes: ['id', 'name', 'phone', 'email', 'hub_id', 'service_center_id', 'latlng', 'last_update_gps'],
            raw: true,
        });

        if (users.length === 0) return { transporters: [] };

        const userIds = users.map((u: any) => Number(u.id));

        // Cek kesibukan: truck_list, job_assigns, order_pickup_drivers, order_deliver_drivers
        const [busyTrucks, busyJobs, busyPickups, busyDelivers] = await Promise.all([
            this.truckModel.findAll({ where: { driver_id: { [Op.in]: userIds }, status: 1 }, attributes: ['driver_id'], raw: true }),
            this.jobAssignModel.findAll({ where: { expeditor_by: { [Op.in]: userIds }, status: 0 }, attributes: ['expeditor_by'], raw: true }).catch(() => [] as any[]),
            this.pickupModel.findAll({ where: { driver_id: { [Op.in]: userIds }, status: 0 }, attributes: ['driver_id'], raw: true }).catch(() => [] as any[]),
            this.deliverModel.findAll({ where: { driver_id: { [Op.in]: userIds }, status: 0 }, attributes: ['driver_id'], raw: true }).catch(() => [] as any[]),
        ]);

        const busySet = new Set<number>();
        busyTrucks.forEach((t: any) => busySet.add(Number(t.driver_id)));
        busyJobs.forEach((j: any) => busySet.add(Number(j.expeditor_by)));
        busyPickups.forEach((p: any) => busySet.add(Number(p.driver_id)));
        busyDelivers.forEach((d: any) => busySet.add(Number(d.driver_id)));

        // Get available trucks for filtered users
        const availableUserIds = users
            .filter((u: any) => !busySet.has(Number(u.id)))
            .map((u: any) => Number(u.id));

        const availableTrucks = await this.truckModel.findAll({
            where: {
                driver_id: { [Op.in]: availableUserIds },
                status: 0 // 0 = tidak digunakan
            },
            attributes: ['id', 'driver_id', 'no_polisi', 'jenis_mobil', 'type'],
            raw: true,
        });

        // Group trucks by driver_id
        const trucksByDriver: any = {};
        availableTrucks.forEach((truck: any) => {
            const driverId = Number(truck.driver_id);
            if (!trucksByDriver[driverId]) {
                trucksByDriver[driverId] = [];
            }
            trucksByDriver[driverId].push({
                truck_id: truck.id,
                no_polisi: truck.no_polisi,
                jenis_mobil: truck.jenis_mobil,
                type: truck.type,
            });
        });

        const transporters = users
            .filter((u: any) => !busySet.has(Number(u.id)))
            .map((u: any) => {

                return {
                    id: Number(u.id),
                    name: u.name || null,
                    phone: u.phone || null,
                    email: u.email || null,
                    hub_id: u.hub_id ?? null,
                    service_center_id: u.service_center_id ?? null,
                    status_ketersediaan: 'Siap Menerima Tugas',
                    lokasi_saat_ini: u.latlng || null,
                    terakhir_update_gps: u.last_update_gps || null,
                    available_trucks: trucksByDriver[Number(u.id)] || [],
                };
            });

        return { transporters };
    }
}


