import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { Op, Transaction } from 'sequelize';
import { CustomerCompany } from '../models/customer-company.model';
import { CustomerCompanyMember } from '../models/customer-company-member.model';
import { CustomerCompanyAddress } from '../models/customer-company-address.model';
import { CustomerCompanyDocument } from '../models/customer-company-document.model';
import { User } from '../models/user.model';
import { FileLog } from '../models/file-log.model';
import { RegisterCustomerCompanyDto } from './dto/register-customer-company.dto';
import { AddCustomerCompanyDocumentDto } from './dto/add-customer-company-document.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CustomerCompaniesService {
    private readonly logger = new Logger(CustomerCompaniesService.name);

    constructor(
        @InjectModel(CustomerCompany)
        private readonly customerCompanyModel: typeof CustomerCompany,
        @InjectModel(CustomerCompanyMember)
        private readonly customerCompanyMemberModel: typeof CustomerCompanyMember,
        @InjectModel(CustomerCompanyAddress)
        private readonly customerCompanyAddressModel: typeof CustomerCompanyAddress,
        @InjectModel(CustomerCompanyDocument)
        private readonly customerCompanyDocumentModel: typeof CustomerCompanyDocument,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(FileLog)
        private readonly fileLogModel: typeof FileLog,
        private readonly authService: AuthService,
    ) { }

    async register(dto: RegisterCustomerCompanyDto) {
        const transaction = await this.customerCompanyModel.sequelize!.transaction();

        try {
            const existingEmail = await this.userModel.findOne({
                where: { email: dto.account.email },
                transaction,
            });
            if (existingEmail) {
                throw new BadRequestException('Email PIC sudah terdaftar');
            }

            const existingPhone = await this.userModel.findOne({
                where: { phone: dto.account.phone },
                transaction,
            });
            if (existingPhone) {
                throw new BadRequestException('Nomor telepon PIC sudah terdaftar');
            }

            const documents = dto.documents || [];

            if (documents.length > 0) {
                const documentFileIds = documents.map((document) => document.file_log_id);
                const uniqueFileIds = new Set(documentFileIds);
                if (uniqueFileIds.size !== documentFileIds.length) {
                    throw new BadRequestException('file_log_id dokumen tidak boleh duplikat');
                }

                const fileLogs = await this.fileLogModel.findAll({
                    where: { id: { [Op.in]: documentFileIds } },
                    transaction,
                });

                if (fileLogs.length !== documentFileIds.length) {
                    throw new BadRequestException('Beberapa file dokumen tidak ditemukan');
                }

                const assignedFile = fileLogs.find((file) => Number(file.is_assigned) === 1);
                if (assignedFile) {
                    throw new BadRequestException(`File dokumen dengan ID ${assignedFile.id} sudah terpakai`);
                }
            }

            let salesUser: User | null = null;
            const trimmedReferralCode = dto.kode_referral_sales?.trim().toUpperCase();
            if (trimmedReferralCode) {
                salesUser = await this.userModel.findOne({
                    where: {
                        kode_referral: trimmedReferralCode,
                        level: 13,
                    },
                    transaction,
                });

                if (!salesUser) {
                    throw new BadRequestException('Kode referral sales tidak valid');
                }
            }

            const now = new Date();
            const hashedPassword = await bcrypt.hash(dto.account.password, 10);

            const newUser = await this.userModel.create({
                name: dto.account.pic_name,
                email: dto.account.email,
                phone: dto.account.phone,
                password: hashedPassword,
                level: dto.account.level || 1,
                customer: 1,
                payment_terms: Number(dto.company.payment_terms_days || 0),
                discount_rate: Number(dto.company.discount_rate || 0),
                address: dto.address.address,
                location: dto.address.location_text,
                referred_by_sales_id: salesUser?.id || null,
                sales_referral_code: trimmedReferralCode || null,
                sales_linked_at: salesUser ? now : null,
                aktif: 1,
                isApprove: 1,
                phone_verify_at: null,
                created_at: now,
                updated_at: now,
            }, { transaction });

            const companyCode = await this.generateCompanyCode(transaction);

            const company = await this.customerCompanyModel.create({
                company_code: companyCode,
                company_name: dto.company.company_name,
                legal_name: dto.company.legal_name || undefined,
                company_email: dto.company.company_email,
                company_phone: dto.company.company_phone?.trim() || undefined,
                company_type: 'b2b',
                status: 'submitted',
                payment_terms_days: Number(dto.company.payment_terms_days || 0),
                discount_rate: Number(dto.company.discount_rate || 0),
                credit_limit: Number(dto.company.credit_limit || 0),
                referred_by_sales_id: salesUser?.id || undefined,
                referral_code_input: trimmedReferralCode || undefined,
                sales_linked_at: salesUser ? now : undefined,
                created_by: newUser.id,
                updated_by: newUser.id,
                created_at: now,
                updated_at: now,
            } as any, { transaction });

            await this.customerCompanyMemberModel.create({
                company_id: company.id,
                user_id: newUser.id,
                role: 'owner',
                is_primary_pic: 1,
                is_active: 1,
                created_at: now,
                updated_at: now,
            } as any, { transaction });

            await this.customerCompanyAddressModel.create({
                company_id: company.id,
                label: dto.address.label?.trim() || undefined,
                contact_name: dto.address.contact_name || dto.account.pic_name,
                contact_phone: dto.address.contact_phone || dto.account.phone,
                contact_email: dto.address.contact_email || dto.account.email,
                address: dto.address.address,
                province: dto.address.province || undefined,
                city: dto.address.city || undefined,
                district: dto.address.district || undefined,
                subdistrict: dto.address.subdistrict || undefined,
                postal_code: dto.address.postal_code || undefined,
                location_text: dto.address.location_text,
                lat: dto.address.lat ?? undefined,
                lng: dto.address.lng ?? undefined,
                is_primary: 1,
                is_billing: 1,
                is_pickup: 1,
                is_return: 0,
                created_at: now,
                updated_at: now,
            } as any, { transaction });

            if (documents.length > 0) {
                const documentFileIds = documents.map((document) => document.file_log_id);
                await this.customerCompanyDocumentModel.bulkCreate(
                    documents.map((document) => ({
                        company_id: company.id,
                        document_type: document.document_type,
                        document_number: document.document_number || undefined,
                        file_log_id: document.file_log_id,
                        status: 'uploaded',
                        created_at: now,
                        updated_at: now,
                    })) as any,
                    { transaction },
                );

                await this.fileLogModel.update(
                    { is_assigned: 1 },
                    {
                        where: { id: { [Op.in]: documentFileIds } },
                        transaction,
                    },
                );
            }

            await transaction.commit();

            try {
                await this.authService.sendRegistrationOtpEmail(dto.account.phone);
            } catch (err) {
                this.logger.error(
                    `Gagal mengirim OTP email setelah registrasi B2B: ${(err as Error).message}`,
                    (err as Error).stack,
                );
            }

            return {
                message:
                    'Registrasi customer company B2B berhasil. Silakan cek email untuk kode OTP verifikasi akun.',
                data: {
                    company_id: company.id,
                    company_code: company.company_code,
                    company_status: company.status,
                    user_id: newUser.id,
                    sales_referral_code: trimmedReferralCode || null,
                },
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Lampirkan dokumen legal ke perusahaan B2B milik user (setelah login + upload file_log).
     */
    async addMyCompanyDocument(userId: number, dto: AddCustomerCompanyDocumentDto) {
        const transaction = await this.customerCompanyModel.sequelize!.transaction();
        try {
            const member = await this.customerCompanyMemberModel.findOne({
                where: { user_id: userId, is_active: 1 },
                order: [['is_primary_pic', 'DESC'], ['id', 'ASC']],
                transaction,
            });
            if (!member) {
                throw new NotFoundException('Tidak ada perusahaan yang terhubung dengan akun ini');
            }

            if (dto.document_type === 'npwp') {
                const existingNpwp = await this.customerCompanyDocumentModel.findOne({
                    where: { company_id: member.company_id, document_type: 'npwp' },
                    transaction,
                });
                if (existingNpwp) {
                    throw new BadRequestException('Dokumen NPWP untuk perusahaan ini sudah ada');
                }
            }

            const fileLog = await this.fileLogModel.findByPk(dto.file_log_id, { transaction });
            if (!fileLog) {
                throw new BadRequestException('File tidak ditemukan');
            }
            if (Number(fileLog.is_assigned) === 1) {
                throw new BadRequestException('File sudah terpakai');
            }

            const now = new Date();
            await this.customerCompanyDocumentModel.create({
                company_id: member.company_id,
                document_type: dto.document_type,
                document_number: dto.document_number?.trim() || undefined,
                file_log_id: dto.file_log_id,
                status: 'uploaded',
                created_at: now,
                updated_at: now,
            } as any, { transaction });

            await this.fileLogModel.update(
                { is_assigned: 1 },
                { where: { id: dto.file_log_id }, transaction },
            );

            await transaction.commit();

            return {
                message: 'Dokumen perusahaan berhasil ditambahkan',
                data: {
                    company_id: member.company_id,
                    document_type: dto.document_type,
                },
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getSummary() {
        const [companies, members, addresses, documents] = await Promise.all([
            this.customerCompanyModel.count(),
            this.customerCompanyMemberModel.count(),
            this.customerCompanyAddressModel.count(),
            this.customerCompanyDocumentModel.count(),
        ]);

        return {
            message: 'Customer companies module ready',
            data: {
                companies,
                members,
                addresses,
                documents,
            },
        };
    }

    async findAll() {
        const companies = await this.customerCompanyModel.findAll({
            include: [
                { association: 'salesReferrer' },
                { association: 'members', include: [{ association: 'user' }] },
                { association: 'addresses' },
                { association: 'documents', include: [{ association: 'file' }, { association: 'verifiedByUser' }] },
            ],
            order: [['created_at', 'DESC']],
        });

        return {
            message: 'Customer companies fetched successfully',
            data: companies,
        };
    }

    async findOne(id: number) {
        const company = await this.customerCompanyModel.findByPk(id, {
            include: [
                { association: 'salesReferrer' },
                { association: 'createdByUser' },
                { association: 'updatedByUser' },
                { association: 'members', include: [{ association: 'user' }] },
                { association: 'addresses' },
                { association: 'documents', include: [{ association: 'file' }, { association: 'verifiedByUser' }] },
            ],
        });

        if (!company) {
            throw new NotFoundException('Customer company tidak ditemukan');
        }

        return {
            message: 'Customer company fetched successfully',
            data: company,
        };
    }

    private async generateCompanyCode(transaction: Transaction): Promise<string> {
        let companyCode = '';
        let exists = true;

        while (exists) {
            companyCode = `CC-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            const found = await this.customerCompanyModel.findOne({
                where: { company_code: companyCode },
                transaction,
            });
            exists = !!found;
        }

        return companyCode;
    }
}
