import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../models/user.model';
import { Hub } from '../models/hub.model';
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
        @InjectModel(Hub) private readonly hubModel: typeof Hub,
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

        const availableTrucks = await this.truckModel.findAll({
            where: {
                driver_id: { [Op.in]: userIds },
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

        const transporters = users.map((u: any) => ({
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
        }));

        return { transporters };
    }

    private normalizeTransportMode(mode?: string): 'darat' | 'laut' | 'udara' {
        const normalizedMode = String(mode ?? 'darat').toLowerCase();
        if (!['darat', 'laut', 'udara'].includes(normalizedMode)) {
            throw new BadRequestException('transport_mode harus darat, laut, atau udara');
        }
        return normalizedMode as 'darat' | 'laut' | 'udara';
    }

    private validateAgentFields(mode: 'darat' | 'laut' | 'udara', agent: any) {
        if (mode === 'darat') return;
        if (!agent?.name || !agent?.address || !agent?.city || !agent?.phone) {
            throw new BadRequestException(
                'Untuk moda laut/udara wajib isi Nama Agent, Alamat, Kota, dan No Telpon'
            );
        }
        if (agent?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(agent.email))) {
            throw new BadRequestException('Format email agent tidak valid');
        }
    }

    async registerTransporter(body: any) {
        const { email, phone, ktp, sim, foto_kurir_sim, foto_ktp, foto_sim, foto_kendaraan, kontak_emergency, alamat, kir, stnk, first_name, last_name, password, role, hub_id, transport_mode, agent_name, agent_address, agent_city, agent_phone, agent_email } = body;
        if (!phone) throw new BadRequestException('Nomor telepon wajib diisi');
        if (!password) throw new BadRequestException('Password wajib diisi');
        let userLevel = 4;
        if (role !== undefined) {
            if (![4, 8].includes(Number(role))) throw new BadRequestException('Role harus 4 (transporter) atau 8 (kurir)');
            userLevel = Number(role);
        }
        const transportMode = this.normalizeTransportMode(transport_mode);
        if (transportMode !== 'darat' && userLevel !== 4) {
            throw new BadRequestException('Moda laut/udara hanya berlaku untuk role transporter');
        }
        if (transportMode === 'darat' && !ktp?.nik) {
            throw new BadRequestException('NIK wajib diisi untuk moda darat');
        }
        this.validateAgentFields(transportMode, {
            name: agent_name,
            address: agent_address,
            city: agent_city,
            phone: agent_phone,
            email: agent_email,
        });

        const orConditions: any[] = [{ phone }];
        if (email) orConditions.push({ email });
        if (ktp?.nik) orConditions.push({ nik: ktp.nik });
        const existing = await this.userModel.findOne({
            where: { [Op.or]: orConditions },
        });
        if (existing) throw new BadRequestException('Email, phone, atau NIK sudah terdaftar');
        if (ktp?.nik && !/^[0-9]{16}$/.test(ktp.nik)) throw new BadRequestException('Format NIK tidak valid');
        const name = [first_name, last_name].filter(Boolean).join(' ') || agent_name;
        // Hash password before storing
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        return await this.sequelize.transaction(async (t) => {
            const user = await this.userModel.create({
                name,
                phone,
                email: email ?? null,
                password: hashedPassword,
                address: alamat,
                isApprove: 1,
                aktif: 1,
                level: userLevel,
                hub_id: hub_id != null && hub_id !== '' ? Number(hub_id) : 0,
                transport_mode: transportMode,
                agent_name: transportMode === 'darat' ? null : agent_name,
                agent_address: transportMode === 'darat' ? null : agent_address,
                agent_city: transportMode === 'darat' ? null : agent_city,
                agent_phone: transportMode === 'darat' ? null : agent_phone,
                agent_email: transportMode === 'darat' ? null : (agent_email ?? null),
                // Field KTP sesuai body
                nik: ktp?.nik,
                ktp_tempat_tanggal_lahir: ktp?.tempat_tanggal_lahir,
                ktp_jenis_kelamin: ktp?.jenis_kelamin,
                ktp_alamat: ktp?.alamat,
                ktp_agama: ktp?.agama,
                ktp_status_perkawinan: ktp?.status_perkawinan,
                // Field SIM detail
                sim: sim?.nomor,
                sim_jenis: sim?.jenis,
                sim_nama_pemegang: sim?.nama_pemegang,
                // Foto terkait dokumen
                url_foto_kurir_sim: foto_kurir_sim,
                url_foto_ktp: foto_ktp || ktp?.foto,
                url_foto_sim: foto_sim || sim?.foto,
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
                hub_id: hub_id != null && hub_id !== '' ? Number(hub_id) : 0,
                isApprove: user.isApprove,
                aktif: user.aktif,
                truck_id: truck ? truck.id : null,
                role: user.level,
                transport_mode: user.transport_mode,
                agent_name: user.agent_name,
                agent_address: user.agent_address,
                agent_city: user.agent_city,
                agent_phone: user.agent_phone,
                agent_email: user.agent_email,
            };
        });
    }

    async listTransportersOrCouriers(role?: string, status?: string, hub_id?: string, page = 1, limit = 10) {
        const where: any = {};
        if (role === '4') where.level = 4;
        else if (role === '8') where.level = 8;
        else where.level = [4, 8];

        if (status === 'approved' || status === '1') where.isApprove = 1;
        else if (status === 'pending' || status === '0') where.isApprove = 0;

        if (hub_id != null && hub_id !== '') {
            const hubIdNum = Number(hub_id);
            if (!Number.isNaN(hubIdNum)) where.hub_id = hubIdNum;
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await this.userModel.findAndCountAll({
            where,
            attributes: ['id', 'name', 'phone', 'isApprove', 'level', 'hub_id', 'status_app', 'transport_mode', 'agent_name', 'agent_city', 'agent_phone', 'agent_email'],
            include: [
                {
                    model: this.hubModel,
                    as: 'hub',
                    attributes: ['id', 'nama'],
                    required: false,
                },
            ],
            order: [['id', 'DESC']],
            offset,
            limit,
        });

        const result = rows.map((u: any) => {
            const hub = u.getDataValue('hub');
            return {
                id: u.getDataValue('id'),
                name: u.getDataValue('name'),
                phone: u.getDataValue('phone'),
                hub_id: u.getDataValue('hub_id'),
                hub_name: hub?.getDataValue?.('nama') ?? null,
                role: u.getDataValue('level'),
                transport_mode: u.getDataValue('transport_mode') ?? 'darat',
                agent_name: u.getDataValue('agent_name'),
                agent_city: u.getDataValue('agent_city'),
                agent_phone: u.getDataValue('agent_phone'),
                agent_email: u.getDataValue('agent_email'),
                status: u.getDataValue('isApprove') === 1 ? 'Approved' : (u.getDataValue('isApprove') === 0 ? 'Pending' : String(u.getDataValue('isApprove'))),
                status_app: u.getDataValue('status_app') ?? null,
            };
        });
        return { data: result, total: count };
    }

    async getTransporterDetail(id: number) {
        if (!id || isNaN(id)) throw new BadRequestException('ID tidak valid');
        const user = await this.userModel.findByPk(id, {
            attributes: [
                'id', 'name', 'phone', 'email', 'level', 'nik', 'address', 'aktif', 'isApprove',
                'ktp_tempat_tanggal_lahir', 'ktp_jenis_kelamin', 'ktp_alamat', 'ktp_agama', 'ktp_status_perkawinan',
                'sim', 'sim_jenis', 'sim_nama_pemegang', 'url_foto_kurir_sim', 'url_foto_ktp', 'url_foto_sim',
                'transport_mode', 'agent_name', 'agent_address', 'agent_city', 'agent_phone', 'agent_email',
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
            transport_mode: user.getDataValue('transport_mode') ?? 'darat',
            agent_name: user.getDataValue('agent_name'),
            agent_address: user.getDataValue('agent_address'),
            agent_city: user.getDataValue('agent_city'),
            agent_phone: user.getDataValue('agent_phone'),
            agent_email: user.getDataValue('agent_email'),
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
            url_foto_ktp: user.getDataValue('url_foto_ktp'),
            url_foto_sim: user.getDataValue('url_foto_sim'),
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
            ktp, sim, foto_kurir_sim, foto_ktp, foto_sim, foto_kendaraan, alamat, kir, stnk, role, kontak_emergency,
            transport_mode, agent_name, agent_address, agent_city, agent_phone, agent_email,
        } = body;
        const targetLevel = role !== undefined && [4, 8].includes(Number(role))
            ? Number(role)
            : Number(user.getDataValue('level'));
        const transportMode = this.normalizeTransportMode(
            transport_mode ?? user.getDataValue('transport_mode') ?? 'darat'
        );
        if (transportMode !== 'darat' && targetLevel !== 4) {
            throw new BadRequestException('Moda laut/udara hanya berlaku untuk role transporter');
        }
        const effectiveAgent = {
            name: agent_name ?? user.getDataValue('agent_name'),
            address: agent_address ?? user.getDataValue('agent_address'),
            city: agent_city ?? user.getDataValue('agent_city'),
            phone: agent_phone ?? user.getDataValue('agent_phone'),
            email: agent_email ?? user.getDataValue('agent_email'),
        };
        this.validateAgentFields(transportMode, effectiveAgent);
        const effectiveNik = ktp?.nik ?? user.getDataValue('nik');
        if (transportMode === 'darat' && !effectiveNik) {
            throw new BadRequestException('NIK wajib diisi untuk moda darat');
        }
        if (effectiveNik && !/^[0-9]{16}$/.test(effectiveNik)) {
            throw new BadRequestException('Format NIK tidak valid');
        }

        const name = [first_name, last_name].filter(Boolean).join(' ') || user.getDataValue('name') || effectiveAgent.name;
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
            url_foto_ktp: foto_ktp || ktp?.foto,
            url_foto_sim: foto_sim || sim?.foto,
            transport_mode: transportMode,
            agent_name: transportMode === 'darat' ? null : effectiveAgent.name,
            agent_address: transportMode === 'darat' ? null : effectiveAgent.address,
            agent_city: transportMode === 'darat' ? null : effectiveAgent.city,
            agent_phone: transportMode === 'darat' ? null : effectiveAgent.phone,
            agent_email: transportMode === 'darat' ? null : effectiveAgent.email,
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

    /**
     * Delete (hard delete) transporter/kurir
     * Menghapus permanent user dan semua data terkait dari database
     */
    async deleteTransporter(id: number) {
        if (!id || isNaN(id)) throw new BadRequestException('ID tidak valid');

        const user = await this.userModel.findByPk(id);
        if (!user) throw new BadRequestException('Transporter/kurir tidak ditemukan');

        const userLevel = user.getDataValue('level');
        if (![4, 8].includes(Number(userLevel))) {
            throw new BadRequestException('User yang dipilih bukan transporter/kurir (level harus 4 atau 8)');
        }

        const userName = user.getDataValue('name');

        return await this.sequelize.transaction(async (t) => {
            await this.usersEmergencyContactModel.destroy({ where: { user_id: id }, transaction: t });
            await this.truckModel.destroy({ where: { driver_id: id }, transaction: t });
            await this.pickupModel.destroy({ where: { driver_id: id }, transaction: t });
            await this.deliverModel.destroy({ where: { driver_id: id }, transaction: t });
            await this.jobAssignModel.destroy({
                where: { expeditor_by: String(id) },
                transaction: t,
            });

            await this.userModel.destroy({ where: { id }, transaction: t });

            return {
                id,
                name: userName,
                message: `Transporter/kurir ${userName} berhasil dihapus`,
            };
        });
    }
}


