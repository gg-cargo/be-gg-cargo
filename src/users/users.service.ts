import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { Level } from '../models/level.model';
import { ServiceCenter } from '../models/service-center.model';
import { Hub } from '../models/hub.model';
import { Saldo } from '../models/saldo.model';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { ListUsersResponseDto, UserResponseDto, PaginationDto, CreateUserResponseDto, UpdateUserResponseDto, ChangePasswordResponseDto } from './dto/user-response.dto';
import { ChangeMyPasswordResponseDto } from './dto/change-my-password-response.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UpdateLocationDto, UpdateLocationResponseDto } from './dto/update-location.dto';
import { Op, Sequelize } from 'sequelize';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(Level)
        private readonly levelModel: typeof Level,
        @InjectModel(ServiceCenter)
        private readonly serviceCenterModel: typeof ServiceCenter,
        @InjectModel(Hub)
        private readonly hubModel: typeof Hub,
        @InjectModel(Saldo)
        private readonly saldoModel: typeof Saldo,
    ) { }

    async listUsers(query: ListUsersDto): Promise<ListUsersResponseDto> {
        const { page = 1, limit = 10, search, sort_by = 'name', order = 'asc', level, status } = query;
        const offset = (page - 1) * limit;

        // Build where conditions
        const whereConditions: any = {};

        if (search) {
            whereConditions[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
            ];
        }

        if (status) {
            if (status === 'Aktif') {
                whereConditions.aktif = 1;
            } else if (status === 'Non Aktif') {
                whereConditions.aktif = 0;
            }
        }

        // Build level filter
        let levelWhereCondition = {};
        if (level) {
            levelWhereCondition = {
                level: level
            };
        }

        // Get total count
        const totalCount = await this.userModel.count({
            where: whereConditions,
            include: level ? [
                {
                    model: this.levelModel,
                    as: 'levelData',
                    where: levelWhereCondition,
                    required: true,
                }
            ] : []
        });

        // Get users with pagination
        const users = await this.userModel.findAll({
            where: whereConditions,
            include: [
                ...(level ? [{
                    model: this.levelModel,
                    as: 'levelData',
                    where: levelWhereCondition,
                    required: true,
                }] : [{
                    model: this.levelModel,
                    as: 'levelData',
                    required: false,
                }]),
                {
                    model: this.serviceCenterModel,
                    as: 'serviceCenter',
                    attributes: ['nama'],
                    required: false,
                },
                {
                    model: this.hubModel,
                    as: 'hub',
                    attributes: ['nama'],
                    required: false,
                },
                {
                    model: this.saldoModel,
                    as: 'saldos',
                    attributes: ['saldo', 'saldo_dibekukan'],
                    required: false,
                }
            ],
            order: this.buildOrderClause(sort_by, order) as any,
            limit,
            offset,
        });

        // Transform data
        const transformedUsers: UserResponseDto[] = users.map(user => {
            const saldos = user.getDataValue('saldos') || [];
            const saldoData = saldos.length > 0 ? saldos[0] : null;
            const saldoAktif = saldoData ? (saldoData.saldo - saldoData.saldo_dibekukan) : 0;

            return {
                id: user.getDataValue('id'),
                code: user.getDataValue('code'),
                service_center: user.getDataValue('serviceCenter')?.getDataValue('nama') || '-',
                name: user.getDataValue('name'),
                email: user.getDataValue('email'),
                phone: user.getDataValue('phone'),
                level: user.getDataValue('levelData')?.getDataValue('nama') || '-',
                status: this.getUserStatus(user),
                saldo: saldoAktif,
            };
        });

        // Build pagination info
        const pagination: PaginationDto = {
            total_items: totalCount,
            total_pages: Math.ceil(totalCount / limit),
            current_page: page,
            items_per_page: limit,
        };

        return {
            message: 'Pengguna berhasil ditemukan',
            data: {
                pagination,
                users: transformedUsers,
            },
        };
    }

    async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
        // Check if email already exists
        const existingEmail = await this.userModel.findOne({
            where: { email: createUserDto.email }
        });
        if (existingEmail) {
            throw new ConflictException('Email sudah terdaftar');
        }

        // Check if phone already exists
        const existingPhone = await this.userModel.findOne({
            where: { phone: createUserDto.phone }
        });
        if (existingPhone) {
            throw new ConflictException('Nomor telepon sudah terdaftar');
        }

        // Validate level exists
        const level = await this.levelModel.findByPk(createUserDto.level_id);
        if (!level) {
            throw new BadRequestException('Level tidak ditemukan');
        }

        // Validate hub if provided
        if (createUserDto.hub_id) {
            const hub = await this.hubModel.findByPk(createUserDto.hub_id);
            if (!hub) {
                throw new BadRequestException('Hub tidak ditemukan');
            }
        }

        // Validate service center if provided
        if (createUserDto.service_center_id) {
            const serviceCenter = await this.serviceCenterModel.findByPk(createUserDto.service_center_id);
            if (!serviceCenter) {
                throw new BadRequestException('Service Center tidak ditemukan');
            }
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

        // Generate user code (optional - bisa disesuaikan dengan business logic)
        const userCode = this.generateUserCode();

        // Generate kode referral otomatis jika level sales (13)
        let kodeReferral: string | null = null;
        if (createUserDto.level_id === 13) {
            kodeReferral = await this.generateUniqueReferralCode('SALES');
        }

        // Create user
        const newUser = await this.userModel.create({
            name: createUserDto.name,
            email: createUserDto.email,
            phone: createUserDto.phone,
            password: hashedPassword,
            level: createUserDto.level_id,
            hub_id: createUserDto.hub_id || 0,
            service_center_id: createUserDto.service_center_id || 0,
            aktif: createUserDto.aktif || 1,
            nik: createUserDto.nik,
            sim: createUserDto.sim,
            stnk: createUserDto.stnk,
            kir: createUserDto.kir,
            expired_sim: createUserDto.expired_sim,
            expired_stnk: createUserDto.expired_stnk,
            expired_kir: createUserDto.expired_kir,
            no_polisi: createUserDto.no_polisi,
            address: createUserDto.address,
            location: createUserDto.location,
            code: userCode,
            kode_referral: kodeReferral,
            phone_verify_at: new Date(), // Set phone verification to current date
            created_at: new Date(),
            updated_at: new Date(),
        });

        return {
            message: 'Pengguna berhasil dibuat',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                level: level.nama,
                status: this.getUserStatus(newUser),
                kode_referral: kodeReferral,
            },
        };
    }

    async getUserById(id: number): Promise<UserDetailResponseDto> {
        const user = await this.userModel.findByPk(id, {
            include: [
                {
                    model: this.levelModel,
                    as: 'levelData',
                    attributes: ['id', 'nama'],
                },
                {
                    model: this.serviceCenterModel,
                    as: 'serviceCenter',
                    attributes: ['id', 'nama'],
                },
                {
                    model: this.hubModel,
                    as: 'hub',
                    attributes: ['id', 'nama'],
                },
                {
                    model: this.saldoModel,
                    as: 'saldos',
                    attributes: ['saldo', 'saldo_dibekukan'],
                    required: false,
                }
            ]
        });

        if (!user) {
            throw new NotFoundException('Pengguna tidak ditemukan');
        }

        const saldos = user.getDataValue('saldos') || [];
        const saldoData = saldos.length > 0 ? saldos[0] : null;
        const saldoAktif = saldoData ? (saldoData.saldo - saldoData.saldo_dibekukan) : 0;

        return {
            message: 'Pengguna berhasil ditemukan',
            data: {
                id: user.getDataValue('id'),
                code: user.getDataValue('code'),
                name: user.getDataValue('name'),
                email: user.getDataValue('email'),
                phone: user.getDataValue('phone'),
                email_verified_at: user.getDataValue('email_verified_at'),
                phone_verify_at: user.getDataValue('phone_verify_at'),
                level: {
                    id: user.getDataValue('levelData')?.getDataValue('id') || 0,
                    nama: user.getDataValue('levelData')?.getDataValue('nama') || '-'
                },
                hub: user.hub ? {
                    id: user.getDataValue('hub')?.getDataValue('id'),
                    nama: user.getDataValue('hub')?.getDataValue('nama')
                } : null,
                service_center: user.serviceCenter ? {
                    id: user.getDataValue('serviceCenter')?.getDataValue('id'),
                    nama: user.getDataValue('serviceCenter')?.getDataValue('nama')
                } : null,
                aktif: user.getDataValue('aktif'),
                status: this.getUserStatus(user),
                nik: user.getDataValue('nik'),
                sim: user.getDataValue('sim'),
                stnk: user.getDataValue('stnk'),
                kir: user.getDataValue('kir'),
                expired_sim: user.getDataValue('expired_sim'),
                expired_stnk: user.getDataValue('expired_stnk'),
                expired_kir: user.getDataValue('expired_kir'),
                no_polisi: user.getDataValue('no_polisi'),
                address: user.getDataValue('address'),
                location: user.getDataValue('location'),
                created_at: user.getDataValue('created_at'),
                updated_at: user.getDataValue('updated_at'),
                customer: user.getDataValue('customer'),
                payment_terms: user.getDataValue('payment_terms'),
                discount_rate: user.getDataValue('discount_rate'),
                type_transporter: user.getDataValue('type_transporter'),
                type_expeditor: user.getDataValue('type_expeditor'),
                stakeholder_id: user.getDataValue('stakeholder_id'),
                aktif_disabled_super: user.getDataValue('aktif_disabled_super'),
                status_app: user.getDataValue('status_app'),
                isSales: user.getDataValue('isSales'),
                isApprove: user.getDataValue('isApprove'),
                isHandover: user.getDataValue('isHandover'),
                show_price: user.getDataValue('show_price'),
                kode_referral: user.getDataValue('kode_referral'),
                saldo: saldoAktif,
            }
        };
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UpdateUserResponseDto> {
        // Check if user exists
        const existingUser = await this.userModel.findByPk(id);
        if (!existingUser) {
            throw new NotFoundException('Pengguna tidak ditemukan');
        }

        // Check if email already exists (if email is being updated)
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const existingEmail = await this.userModel.findOne({
                where: {
                    email: updateUserDto.email,
                    id: { [Op.ne]: id } // Exclude current user
                }
            });
            if (existingEmail) {
                throw new ConflictException('Email sudah terdaftar');
            }
        }

        // Check if phone already exists (if phone is being updated)
        if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
            const existingPhone = await this.userModel.findOne({
                where: {
                    phone: updateUserDto.phone,
                    id: { [Op.ne]: id } // Exclude current user
                }
            });
            if (existingPhone) {
                throw new ConflictException('Nomor telepon sudah terdaftar');
            }
        }

        // Validate level exists (if level is being updated)
        if (updateUserDto.level_id) {
            const level = await this.levelModel.findByPk(updateUserDto.level_id);
            if (!level) {
                throw new BadRequestException('Level tidak ditemukan');
            }
        }

        // Validate hub exists (if hub is being updated)
        if (updateUserDto.hub_id) {
            const hub = await this.hubModel.findByPk(updateUserDto.hub_id);
            if (!hub) {
                throw new BadRequestException('Hub tidak ditemukan');
            }
        }

        // Validate service center exists (if service center is being updated)
        if (updateUserDto.service_center_id) {
            const serviceCenter = await this.serviceCenterModel.findByPk(updateUserDto.service_center_id);
            if (!serviceCenter) {
                throw new BadRequestException('Service Center tidak ditemukan');
            }
        }

        // Prepare update data
        const updateData: any = {
            updated_at: new Date(),
        };

        // Add fields that are being updated
        if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
        if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
        if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
        if (updateUserDto.level_id !== undefined) updateData.level = updateUserDto.level_id;
        if (updateUserDto.hub_id !== undefined) updateData.hub_id = updateUserDto.hub_id;
        if (updateUserDto.service_center_id !== undefined) updateData.service_center_id = updateUserDto.service_center_id;
        if (updateUserDto.aktif !== undefined) updateData.aktif = updateUserDto.aktif;
        if (updateUserDto.nik !== undefined) updateData.nik = updateUserDto.nik;
        if (updateUserDto.sim !== undefined) updateData.sim = updateUserDto.sim;
        if (updateUserDto.stnk !== undefined) updateData.stnk = updateUserDto.stnk;
        if (updateUserDto.kir !== undefined) updateData.kir = updateUserDto.kir;
        if (updateUserDto.expired_sim !== undefined) updateData.expired_sim = updateUserDto.expired_sim;
        if (updateUserDto.expired_stnk !== undefined) updateData.expired_stnk = updateUserDto.expired_stnk;
        if (updateUserDto.expired_kir !== undefined) updateData.expired_kir = updateUserDto.expired_kir;
        if (updateUserDto.no_polisi !== undefined) updateData.no_polisi = updateUserDto.no_polisi;
        if (updateUserDto.address !== undefined) updateData.address = updateUserDto.address;
        if (updateUserDto.location !== undefined) updateData.location = updateUserDto.location;
        if (updateUserDto.customer !== undefined) updateData.customer = updateUserDto.customer;
        if (updateUserDto.payment_terms !== undefined) updateData.payment_terms = updateUserDto.payment_terms;
        if (updateUserDto.discount_rate !== undefined) updateData.discount_rate = updateUserDto.discount_rate;
        if (updateUserDto.type_transporter !== undefined) updateData.type_transporter = updateUserDto.type_transporter;
        if (updateUserDto.type_expeditor !== undefined) updateData.type_expeditor = updateUserDto.type_expeditor;
        if (updateUserDto.stakeholder_id !== undefined) updateData.stakeholder_id = updateUserDto.stakeholder_id;
        if (updateUserDto.aktif_disabled_super !== undefined) updateData.aktif_disabled_super = updateUserDto.aktif_disabled_super;
        if (updateUserDto.status_app !== undefined) updateData.status_app = updateUserDto.status_app;
        if (updateUserDto.isSales !== undefined) updateData.isSales = updateUserDto.isSales;
        if (updateUserDto.isApprove !== undefined) updateData.isApprove = updateUserDto.isApprove;
        if (updateUserDto.isHandover !== undefined) updateData.isHandover = updateUserDto.isHandover;
        if (updateUserDto.show_price !== undefined) updateData.show_price = updateUserDto.show_price;

        // Update user
        await this.userModel.update(updateData, {
            where: { id }
        });

        // Get updated user with relations
        const updatedUser = await this.userModel.findByPk(id, {
            include: [
                {
                    model: this.levelModel,
                    as: 'levelData',
                    attributes: ['nama'],
                }
            ]
        });

        if (!updatedUser) {
            throw new NotFoundException('Pengguna tidak ditemukan setelah update');
        }

        return {
            message: 'Pengguna berhasil diperbarui',
            data: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                level: updatedUser.levelData?.nama || '-',
                status: this.getUserStatus(updatedUser),
            },
        };
    }

    private generateUserCode(): string {
        // Generate simple user code - bisa disesuaikan dengan business logic
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `USR${timestamp}${random}`;
    }

    private buildOrderClause(sort_by: string, order: string) {
        const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';

        switch (sort_by) {
            case 'name':
                return [['name', orderDirection]];
            case 'email':
                return [['email', orderDirection]];
            case 'phone':
                return [['phone', orderDirection]];
            case 'code':
                return [['code', orderDirection]];
            case 'level':
                return [['level', orderDirection]]; // Sort by level ID instead
            case 'status':
                return [['aktif', orderDirection]];
            case 'saldo':
                return [['saldo', orderDirection]];
            default:
                return [['name', 'ASC']];
        }
    }

    private getUserStatus(user: User): string {
        if (user.aktif === 0) {
            return 'Non Aktif';
        }

        // Since phone_verify_at is now set when creating user, check for email verification
        if (user.email_verified_at && user.phone_verify_at) {
            return 'Verified';
        } else if (user.phone_verify_at) {
            return 'Phone Verified';
        }

        return 'Aktif';
    }

    async changePassword(currentUserId: number, changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
        // Validasi password baru dan konfirmasi password
        if (changePasswordDto.new_password !== changePasswordDto.confirm_password) {
            throw new BadRequestException('Konfirmasi password tidak cocok');
        }

        // Tentukan target user ID
        const targetUserId = changePasswordDto.target_user_id || currentUserId;

        // Ambil current user untuk cek level
        const currentUser = await this.userModel.findByPk(currentUserId, {
            include: [
                {
                    model: this.levelModel,
                    as: 'levelData',
                    attributes: ['nama'],
                }
            ]
        });
        if (!currentUser) {
            throw new NotFoundException('User tidak ditemukan');
        }

        // Cek apakah current user adalah admin atau target user adalah dirinya sendiri
        const currentUserLevel = currentUser.getDataValue('levelData')?.getDataValue('nama');
        const isAdmin = currentUserLevel === 'administrator';
        const isOwnPassword = targetUserId === currentUserId;

        if (!isAdmin && !isOwnPassword) {
            throw new BadRequestException('Anda tidak memiliki izin untuk mengubah password user lain');
        }

        // Ambil target user
        const targetUser = await this.userModel.findByPk(targetUserId);
        if (!targetUser) {
            throw new NotFoundException('Target user tidak ditemukan');
        }

        // Hash password baru
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(changePasswordDto.new_password, saltRounds);

        // Update password
        await this.userModel.update(
            {
                password: hashedNewPassword,
                updated_at: new Date(),
            },
            {
                where: { id: targetUserId }
            }
        );

        const message = isOwnPassword
            ? 'Password berhasil diubah'
            : `Password user ${targetUser.getDataValue('name')} berhasil diubah`;

        return {
            message,
            success: true,
        };
    }

    async changeMyPassword(currentUserId: number, changeMyPasswordDto: ChangeMyPasswordDto): Promise<ChangeMyPasswordResponseDto> {
        // Validasi password baru dan konfirmasi password
        if (changeMyPasswordDto.new_password !== changeMyPasswordDto.confirm_new_password) {
            throw new BadRequestException('Konfirmasi password baru tidak cocok');
        }

        // Ambil current user
        const currentUser = await this.userModel.findByPk(currentUserId);
        if (!currentUser) {
            throw new NotFoundException('User tidak ditemukan');
        }

        // Validasi password user ada
        if (!currentUser.getDataValue('password')) {
            throw new BadRequestException('User tidak memiliki password yang valid');
        }

        // Validasi old_password tidak kosong
        if (!changeMyPasswordDto.old_password || changeMyPasswordDto.old_password.trim() === '') {
            throw new BadRequestException('Password lama tidak boleh kosong');
        }



        // Verifikasi password lama
        const isOldPasswordValid = await bcrypt.compare(changeMyPasswordDto.old_password, currentUser.getDataValue('password'));
        if (!isOldPasswordValid) {
            throw new BadRequestException('Password lama tidak valid');
        }

        // Hash password baru
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(changeMyPasswordDto.new_password, saltRounds);

        // Update password
        await this.userModel.update(
            {
                password: hashedNewPassword,
                updated_at: new Date(),
            },
            {
                where: { id: currentUserId }
            }
        );

        // TODO: Hapus semua token otentikasi yang masih aktif untuk user ini
        // Ini bisa diimplementasikan jika ada tabel oauth_access_tokens atau similar

        return {
            message: 'Password berhasil diubah. Silakan login ulang dengan password baru.',
            success: true,
        };
    }

    async updateMyLocation(userId: number, updateLocationDto: UpdateLocationDto): Promise<UpdateLocationResponseDto> {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const rawLatlng = updateLocationDto.latlng?.trim();
        if (!rawLatlng) {
            throw new BadRequestException('Lokasi (latlng) tidak boleh kosong');
        }

        const [latStr, lngStr] = rawLatlng.split(',').map(part => part.trim());
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lngStr);

        if (!latStr || !lngStr || Number.isNaN(latitude) || Number.isNaN(longitude)) {
            throw new BadRequestException('Format latlng tidak valid. Gunakan format "latitude,longitude"');
        }

        if (latitude < -90 || latitude > 90) {
            throw new BadRequestException('Nilai latitude harus berada pada rentang -90 hingga 90');
        }

        if (longitude < -180 || longitude > 180) {
            throw new BadRequestException('Nilai longitude harus berada pada rentang -180 hingga 180');
        }

        const normalizedLatlng = `${latitude},${longitude}`;
        const now = new Date();

        await this.userModel.update(
            {
                latlng: normalizedLatlng,
                last_update_gps: now,
                updated_at: now,
            },
            {
                where: { id: userId },
            }
        );

        return {
            message: 'Lokasi berhasil diperbarui',
            success: true,
            data: {
                latlng: normalizedLatlng,
                last_update_gps: now,
            },
        };
    }

    /**
     * Link customer ke sales berdasarkan kode referral
     */
    async linkUserToSales(userId: number, kodeReferral: string): Promise<any> {
        const trimmedCode = kodeReferral.trim().toUpperCase();

        // Validasi kode referral sales
        const sales = await this.userModel.findOne({
            where: {
                kode_referral: trimmedCode,
                level: 13,
            },
            attributes: ['id', 'name', 'kode_referral', 'email', 'phone'],
        });

        if (!sales) {
            throw new NotFoundException('Kode referral sales tidak valid');
        }

        // Cek apakah user sudah linked ke sales yang sama
        const currentUser = await this.userModel.findByPk(userId, {
            attributes: ['id', 'referred_by_sales_id', 'sales_referral_code'],
        });

        if (currentUser?.referred_by_sales_id === sales.id) {
            return {
                success: true,
                message: 'Anda sudah terhubung dengan sales ini',
                data: {
                    sales_name: sales.name,
                    sales_code: sales.kode_referral,
                    sales_email: sales.email,
                    sales_phone: sales.phone,
                    linked_at: currentUser.sales_linked_at,
                },
            };
        }

        // Update user dengan sales referral
        const now = new Date();
        await this.userModel.update(
            {
                referred_by_sales_id: sales.id,
                sales_referral_code: trimmedCode,
                sales_linked_at: now,
            },
            {
                where: { id: userId },
            }
        );

        return {
            success: true,
            message: 'Berhasil terhubung dengan sales',
            data: {
                sales_name: sales.name,
                sales_code: sales.kode_referral,
                sales_email: sales.email,
                sales_phone: sales.phone,
                linked_at: now,
            },
        };
    }

    /**
     * Get info sales yang terhubung dengan customer
     */
    async getMySalesInfo(userId: number): Promise<any> {
        const user = await this.userModel.findByPk(userId, {
            include: [
                {
                    model: User,
                    as: 'mySales',
                    attributes: ['id', 'name', 'kode_referral', 'email', 'phone'],
                },
            ],
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        if (!user.getDataValue('mySales')) {
            return {
                success: true,
                message: 'Anda belum terhubung dengan sales',
                data: null,
            };
        }

        return {
            success: true,
            message: 'Informasi sales Anda',
            data: {
                sales_id: user.getDataValue('mySales')?.getDataValue('id'),
                sales_name: user.getDataValue('mySales')?.getDataValue('name'),
                sales_code: user.getDataValue('mySales')?.getDataValue('kode_referral'),
                sales_email: user.getDataValue('mySales')?.getDataValue('email'),
                sales_phone: user.getDataValue('mySales')?.getDataValue('phone'),
                linked_at: user.sales_linked_at,
            },
        };
    }

    /**
     * Unlink customer dari sales
     */
    async unlinkUserFromSales(userId: number): Promise<any> {
        const user = await this.userModel.findByPk(userId, {
            attributes: ['id', 'referred_by_sales_id'],
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        if (!user.getDataValue('referred_by_sales_id')) {
            return {
                success: true,
                message: 'Anda tidak terhubung dengan sales manapun',
            };
        }

        await this.userModel.update(
            {
                referred_by_sales_id: null,
                sales_referral_code: null,
                sales_linked_at: null,
            },
            {
                where: { id: userId },
            }
        );

        return {
            success: true,
            message: 'Berhasil memutus hubungan dengan sales',
        };
    }

    /**
     * Generate kode referral untuk user sales
     */
    async generateReferralCode(userId: number, prefix: string = 'SALES'): Promise<any> {
        // Cek apakah user sudah punya kode referral
        const user = await this.userModel.findByPk(userId, {
            attributes: ['id', 'name', 'kode_referral', 'level'],
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        // Validasi level (hanya sales yang bisa generate)
        if (user.level !== 13) {
            throw new BadRequestException('Hanya user dengan level sales yang dapat generate kode referral');
        }

        // Jika sudah punya kode, return yang existing
        if (user.kode_referral) {
            return {
                success: true,
                message: 'User sudah memiliki kode referral',
                data: {
                    kode_referral: user.kode_referral,
                    is_new: false,
                },
            };
        }

        // Generate kode referral baru
        const kodeReferral = await this.generateUniqueReferralCode(prefix);

        // Update user dengan kode referral
        await this.userModel.update(
            { kode_referral: kodeReferral },
            { where: { id: userId } }
        );

        return {
            success: true,
            message: 'Kode referral berhasil di-generate',
            data: {
                kode_referral: kodeReferral,
                is_new: true,
            },
        };
    }

    /**
     * Generate unique referral code dengan format: PREFIX + 3 digit number
     * Contoh: SALES001, SALESPLG001, dll
     */
    private async generateUniqueReferralCode(prefix: string = 'SALES'): Promise<string> {
        // Normalize prefix (uppercase, remove spaces)
        const normalizedPrefix = prefix.trim().toUpperCase().replace(/\s+/g, '');

        // Cari kode referral terakhir dengan prefix yang sama
        const existingCodes = await this.userModel.findAll({
            where: {
                kode_referral: { [Op.like]: `${normalizedPrefix}%` },
            },
            order: [['id', 'DESC']],
            limit: 1,
        });

        let nextNumber = 1;
        if (existingCodes.length > 0) {
            const lastCode = existingCodes[0].getDataValue('kode_referral');
            if (lastCode) {
                // Extract number dari kode (e.g., "SALES001" -> 1, "SALESPLG123" -> 123)
                const match = lastCode.match(/\d+$/);
                if (match) {
                    nextNumber = parseInt(match[0], 10) + 1;
                }
            }
        }

        // Format: SALES001, SALES002, SALESPLG001, etc.
        return `${normalizedPrefix}${String(nextNumber).padStart(3, '0')}`;
    }

    /**
     * Get list customer yang belum terhubung dengan sales (unassigned)
     */
    async getUnassignedCustomers(query: {
        page?: number;
        limit?: number;
        search?: string;
        level?: number;
    }): Promise<any> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        const whereCondition: any = {
            referred_by_sales_id: null, // Belum terhubung dengan sales
            level: query.level || 1, // Default level customer (1)
        };

        if (query.search) {
            whereCondition[Op.or] = [
                { name: { [Op.like]: `%${query.search}%` } },
                { email: { [Op.like]: `%${query.search}%` } },
                { phone: { [Op.like]: `%${query.search}%` } },
            ];
        }

        // Get total count
        const totalCount = await this.userModel.count({
            where: whereCondition,
        });

        // Get customers with pagination
        const customers = await this.userModel.findAll({
            where: whereCondition,
            attributes: ['id', 'name', 'email', 'phone', 'level', 'aktif', 'created_at'],
            include: [
                {
                    model: this.levelModel,
                    as: 'levelData',
                    attributes: ['id', 'nama', 'level'],
                },
            ],
            order: [['name', 'ASC']],
            limit,
            offset,
        });

        return {
            success: true,
            message: 'Daftar customer yang belum terhubung dengan sales',
            data: {
                customers: customers.map((customer: any) => ({
                    id: customer.getDataValue('id'),
                    name: customer.getDataValue('name'),
                    email: customer.getDataValue('email'),
                    phone: customer.getDataValue('phone'),
                    level: customer.getDataValue('levelData')?.getDataValue('nama') || 'Unknown',
                    aktif: customer.getDataValue('aktif'),
                    created_at: customer.getDataValue('created_at'),
                    kode_referral: customer.getDataValue('kode_referral'),
                })),
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            },
        };
    }

    /**
     * Bulk assign customer ke sales (master/admin action)
     */
    async bulkAssignCustomersToSales(customerIds: number[], salesId: number): Promise<any> {
        // Validasi sales exists & level 13
        const sales = await this.userModel.findByPk(salesId, {
            attributes: ['id', 'name', 'kode_referral', 'level'],
        });

        if (!sales) {
            throw new NotFoundException('Sales tidak ditemukan');
        }

        if (sales.getDataValue('level') !== 13) {
            throw new BadRequestException('User yang dipilih bukan sales (level harus 13)');
        }

        if (!sales.getDataValue('kode_referral')) {
            throw new BadRequestException('Sales belum memiliki kode referral. Silakan generate kode referral terlebih dahulu.');
        }

        // Validasi customer IDs
        const customers = await this.userModel.findAll({
            where: { id: { [Op.in]: customerIds } },
            attributes: ['id', 'name', 'referred_by_sales_id'],
        });

        if (customers.length !== customerIds.length) {
            throw new BadRequestException('Beberapa customer ID tidak ditemukan');
        }

        // Filter customer yang belum terhubung atau terhubung dengan sales lain
        const now = new Date();
        const updateData: any = {
            referred_by_sales_id: salesId,
            sales_referral_code: sales.getDataValue('kode_referral'),
            sales_linked_at: now,
        };

        // Update multiple customers
        const [affectedRows] = await this.userModel.update(updateData, {
            where: { id: { [Op.in]: customerIds } },
        });

        return {
            success: true,
            message: `Berhasil assign ${affectedRows} customer ke sales ${sales.name}`,
            data: {
                sales_id: sales.getDataValue('id'),
                sales_name: sales.getDataValue('name'),
                sales_code: sales.getDataValue('kode_referral'),
                assigned_count: affectedRows,
                customer_ids: customerIds,
            },
        };
    }

    /**
     * Get list customer dan sales yang terhubung (customer-sales assignments)
     */
    async getCustomerSalesAssignments(query: {
        page?: number;
        limit?: number;
        search?: string;
        sales_id?: number;
    }): Promise<any> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        const whereCondition: any = {
            referred_by_sales_id: { [Op.ne]: null }, // Sudah terhubung dengan sales
        };

        if (query.sales_id) {
            whereCondition.referred_by_sales_id = query.sales_id;
        }

        if (query.search) {
            whereCondition[Op.or] = [
                { name: { [Op.like]: `%${query.search}%` } },
                { email: { [Op.like]: `%${query.search}%` } },
                { phone: { [Op.like]: `%${query.search}%` } },
            ];
        }

        // Get total count
        const totalCount = await this.userModel.count({
            where: whereCondition,
        });

        // Get customers with sales info
        const customers = await this.userModel.findAll({
            where: whereCondition,
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'level',
                'aktif',
                'referred_by_sales_id',
                'sales_referral_code',
                'sales_linked_at',
                'created_at',
            ],
            include: [
                {
                    model: this.levelModel,
                    as: 'levelData',
                    attributes: ['id', 'nama', 'level'],
                },
                {
                    model: User,
                    as: 'mySales',
                    attributes: ['id', 'name', 'kode_referral', 'email', 'phone'],
                },
            ],
            order: [['name', 'ASC']],
            limit,
            offset,
        });

        return {
            success: true,
            message: 'Daftar customer dan sales yang terhubung',
            data: {
                assignments: customers.map((customer: any) => ({
                    customer_id: customer.getDataValue('id'),
                    customer_name: customer.getDataValue('name'),
                    customer_email: customer.getDataValue('email'),
                    customer_phone: customer.getDataValue('phone'),
                    customer_level: customer.getDataValue('levelData')?.getDataValue('nama') || 'Unknown',
                    sales_id: customer.getDataValue('referred_by_sales_id'),
                    sales_name: customer.getDataValue('mySales')?.getDataValue('name') || 'Unknown',
                    sales_code: customer.getDataValue('sales_referral_code'),
                    sales_email: customer.getDataValue('mySales')?.getDataValue('email'),
                    sales_phone: customer.getDataValue('mySales')?.getDataValue('phone'),
                    linked_at: customer.getDataValue('sales_linked_at'),
                    customer_created_at: customer.getDataValue('created_at'),
                })),
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            },
        };
    }
} 