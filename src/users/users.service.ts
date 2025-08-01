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
import { ListUsersResponseDto, UserResponseDto, PaginationDto, CreateUserResponseDto, UpdateUserResponseDto } from './dto/user-response.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
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
                nama: level
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
} 