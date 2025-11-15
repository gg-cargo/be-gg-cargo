import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../models/user.model';
import { TruckList } from '../models/truck-list.model';
import { JobAssign } from '../models/job-assign.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';
import { AvailableTransportersQueryDto, AvailableTransportersResponseDto } from './dto/available-transporters.dto';
import { Sequelize } from 'sequelize-typescript';
import { UsersEmergencyContact } from '../models/users_emergency_contact.model';

@Injectable()
export class TransportersService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(TruckList) private readonly truckModel: typeof TruckList,
        @InjectModel(JobAssign) private readonly jobAssignModel: typeof JobAssign,
        @InjectModel(OrderPickupDriver) private readonly pickupModel: typeof OrderPickupDriver,
        @InjectModel(OrderDeliverDriver) private readonly deliverModel: typeof OrderDeliverDriver,
        @InjectModel(UsersEmergencyContact) private readonly usersEmergencyContactModel: typeof UsersEmergencyContact,
        private readonly sequelize: Sequelize
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

    async registerTransporter(body: any) {
        const { email, phone, ktp, sim, foto_kurir_sim, foto_kendaraan, kontak_emergency, alamat, kir, stnk, first_name, last_name, password, role } = body;
        if (!email || !phone || !ktp?.nik) throw new BadRequestException('Data utama tidak lengkap');
        if (!password) throw new BadRequestException('Password wajib diisi');
        let userLevel = 4;
        if (role !== undefined) {
            if (![4, 8].includes(Number(role))) throw new BadRequestException('Role harus 4 (transporter) atau 8 (kurir)');
            userLevel = Number(role);
        }
        const existing = await this.userModel.findOne({
            where: { [Op.or]: [{ email }, { phone }, { nik: ktp.nik }] },
        });
        if (existing) throw new BadRequestException('Email, phone, atau NIK sudah terdaftar');
        if (!/^[0-9]{16}$/.test(ktp.nik)) throw new BadRequestException('Format NIK tidak valid');
        const name = [first_name, last_name].filter(Boolean).join(' ');
        // Hash password before storing
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        return await this.sequelize.transaction(async (t) => {
            const user = await this.userModel.create({
                name,
                phone,
                email,
                password: hashedPassword,
                nik: ktp.nik,
                address: alamat,
                sim: sim?.nomor,
                isApprove: 0,
                aktif: 0,
                level: userLevel,
                // Field KTP sesuai body
                ktp_tempat_tanggal_lahir: ktp.tempat_tanggal_lahir,
                ktp_jenis_kelamin: ktp.jenis_kelamin,
                ktp_alamat: ktp.alamat,
                ktp_agama: ktp.agama,
                ktp_status_perkawinan: ktp.status_perkawinan,
                // Field SIM detail
                sim_jenis: sim?.jenis,
                sim_nama_pemegang: sim?.nama_pemegang,
                // Foto terkait dokumen
                url_foto_kurir_sim: foto_kurir_sim,
            }, { transaction: t });
            // Simpan data truk (opsional)
            let truck: any = null;
            if (foto_kendaraan && Array.isArray(foto_kendaraan) && foto_kendaraan.length > 0) {
                truck = await this.truckModel.create({
                    driver_id: user.id,
                    image: JSON.stringify(foto_kendaraan),
                    jenis_mobil: sim?.jenis,
                    kir_url: kir,
                    stnk_url: stnk,
                } as any, { transaction: t });
            }
            // Simpan kontak emergency (opsional)
            if (kontak_emergency && Array.isArray(kontak_emergency)) {
                for (const kc of kontak_emergency) {
                    await this.usersEmergencyContactModel.create({
                        user_id: user.id,
                        nomor: kc.nomor,
                        keterangan: kc.keterangan,
                    }, { transaction: t });
                }
            }
            return {
                user_id: user.id,
                name,
                isApprove: user.isApprove,
                aktif: user.aktif,
                truck_id: truck ? truck.id : null,
                role: user.level,
            };
        });
    }

    async listTransportersOrCouriers(role?: string, page = 1, limit = 10) {
        const where: any = {};
        if (role === '4') where.level = 4;
        else if (role === '8') where.level = 8;
        else where.level = [4, 8];

        const offset = (page - 1) * limit;
        const { count, rows } = await this.userModel.findAndCountAll({
            where,
            attributes: ['id', 'name', 'phone', 'isApprove'],
            order: [['id', 'DESC']],
            offset,
            limit,
        });

        const result = rows.map((u: any) => ({
            id: u.getDataValue('id'),
            name: u.getDataValue('name'),
            phone: u.getDataValue('phone'),
            status: u.getDataValue('isApprove') === 1 ? 'Approved' : (u.getDataValue('isApprove') === 0 ? 'Pending' : String(u.getDataValue('isApprove')))
        }));
        return { data: result, total: count };
    }

    async getTransporterDetail(id: number) {
        if (!id || isNaN(id)) throw new BadRequestException('ID tidak valid');
        const user = await this.userModel.findByPk(id, {
            attributes: [
                'id', 'name', 'phone', 'email', 'level', 'nik', 'address', 'aktif', 'isApprove',
                'ktp_tempat_tanggal_lahir', 'ktp_jenis_kelamin', 'ktp_alamat', 'ktp_agama', 'ktp_status_perkawinan',
                'sim', 'sim_jenis', 'sim_nama_pemegang', 'url_foto_kurir_sim'
            ],
            include: [
                {
                    model: this.truckModel,
                    as: 'trucks', // relasi User.hasMany(TruckList, ... as: 'trucks')
                },
                {
                    model: this.usersEmergencyContactModel,
                    as: 'emergencyContacts',
                },
            ],
        });
        if (!user) throw new BadRequestException('Transporter tidak ditemukan');
        // Mapping field untuk response
        return {
            id: user.getDataValue('id'),
            name: user.getDataValue('name'),
            phone: user.getDataValue('phone'),
            email: user.getDataValue('email'),
            role: user.getDataValue('level'),
            nik: user.getDataValue('nik'),
            alamat: user.getDataValue('address'),
            aktif: user.getDataValue('aktif'),
            status: user.getDataValue('isApprove') === 1 ? 'Approved' : (user.getDataValue('isApprove') === 0 ? 'Pending' : String(user.getDataValue('isApprove'))),
            ktp_tempat_tanggal_lahir: user.getDataValue('ktp_tempat_tanggal_lahir'),
            ktp_jenis_kelamin: user.getDataValue('ktp_jenis_kelamin'),
            ktp_alamat: user.getDataValue('ktp_alamat'),
            ktp_agama: user.getDataValue('ktp_agama'),
            ktp_status_perkawinan: user.getDataValue('ktp_status_perkawinan'),
            sim: user.getDataValue('sim'),
            sim_jenis: user.getDataValue('sim_jenis'),
            sim_nama_pemegang: user.getDataValue('sim_nama_pemegang'),
            url_foto_kurir_sim: user.getDataValue('url_foto_kurir_sim'),
            trucks: user.getDataValue('trucks')?.map((t: any) => ({
                id: t.getDataValue('id'),
                jenis_mobil: t.getDataValue('jenis_mobil'),
                image: t.getDataValue('image'),
                kir_url: t.getDataValue('kir_url'),
                stnk_url: t.getDataValue('stnk_url'),
                no_polisi: t.getDataValue('no_polisi'),
            })) || [],
            emergency_contacts: user.getDataValue('emergencyContacts')?.map((e: any) => ({
                nomor: e.getDataValue('nomor'),
                keterangan: e.getDataValue('keterangan')
            })) || [],
        };
    }

    async updateTransporter(id: number, body: any) {
        if (!id || isNaN(id)) throw new BadRequestException('ID tidak valid');
        const user = await this.userModel.findByPk(id);
        if (!user) throw new BadRequestException('Transporter tidak ditemukan');
        const {
            first_name, last_name, email, phone, password,
            ktp, sim, foto_kurir_sim, foto_kendaraan, alamat, kir, stnk, role, kontak_emergency
        } = body;
        const name = [first_name, last_name].filter(Boolean).join(' ');
        // Normalisasi update fields
        const updateFields: any = {
            email, phone, address: alamat, nik: ktp?.nik, name,
            ktp_tempat_tanggal_lahir: ktp?.tempat_tanggal_lahir,
            ktp_jenis_kelamin: ktp?.jenis_kelamin,
            ktp_alamat: ktp?.alamat,
            ktp_agama: ktp?.agama,
            ktp_status_perkawinan: ktp?.status_perkawinan,
            sim: sim?.nomor,
            sim_jenis: sim?.jenis,
            sim_nama_pemegang: sim?.nama_pemegang,
            url_foto_kurir_sim: foto_kurir_sim,
        };
        if (role !== undefined && [4, 8].includes(Number(role))) updateFields.level = Number(role);
        // Password
        if (password) {
            const bcrypt = require('bcryptjs');
            updateFields.password = await bcrypt.hash(password, 10);
        }
        return await this.sequelize.transaction(async (t) => {
            // Update user
            await this.userModel.update(updateFields, { where: { id }, transaction: t });
            // Truck update (hapus semua, buat baru jika ada array baru)
            if (foto_kendaraan) {
                await this.truckModel.destroy({ where: { driver_id: id }, transaction: t });
                if (Array.isArray(foto_kendaraan) && foto_kendaraan.length > 0) {
                    await this.truckModel.create({
                        driver_id: id,
                        image: JSON.stringify(foto_kendaraan),
                        jenis_mobil: sim?.jenis,
                        kir_url: kir,
                        stnk_url: stnk,
                    } as any, { transaction: t });
                }
            }
            // Kontak emergency update (hapus semua, insert baru)
            if (Array.isArray(kontak_emergency)) {
                await this.usersEmergencyContactModel.destroy({ where: { user_id: id }, transaction: t });
                for (const kc of kontak_emergency) {
                    await this.usersEmergencyContactModel.create({
                        user_id: id,
                        nomor: kc.nomor,
                        keterangan: kc.keterangan,
                    }, { transaction: t });
                }
            }
            // Ambil dan kembalikan detail
            return await this.getTransporterDetail(id);
        });
    }

    async approveTransporter(id: number) {
        if (!id || isNaN(id)) throw new BadRequestException('ID tidak valid');

        const user = await this.userModel.findByPk(id);
        if (!user) throw new BadRequestException('Transporter tidak ditemukan');

        const userLevel = user.getDataValue('level');
        if (![4, 8].includes(Number(userLevel))) {
            throw new BadRequestException('User yang dipilih bukan transporter/kurir (level harus 4 atau 8)');
        }

        const currentIsApprove = user.getDataValue('isApprove');
        if (currentIsApprove === 1) {
            throw new BadRequestException('Transporter sudah di-approve sebelumnya');
        }

        // Update isApprove menjadi 1 dan aktif menjadi 1
        await this.userModel.update(
            {
                isApprove: 1,
                aktif: 1,
            },
            { where: { id } }
        );

        // Ambil dan kembalikan detail yang sudah di-update
        return await this.getTransporterDetail(id);
    }
}


