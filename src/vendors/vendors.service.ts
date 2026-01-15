import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from '../models/vendor.model';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateVendorResponseDto } from './dto/create-vendor-response.dto';
import { ListVendorsQueryDto, ListVendorsResponseDto, VendorListItemDto, PaginationDto } from './dto/list-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Op } from 'sequelize';

@Injectable()
export class VendorsService {
    private readonly logger = new Logger(VendorsService.name);

    constructor(
        @InjectModel(Vendor)
        private vendorModel: typeof Vendor,
    ) { }

    async createVendor(dto: CreateVendorDto): Promise<CreateVendorResponseDto> {
        // 1. Validasi unik: kode_vendor (jika ada)
        if (dto.kode_vendor) {
            const existingVendor = await this.vendorModel.findOne({
                where: { kode_vendor: dto.kode_vendor },
            });
            if (existingVendor) {
                throw new ConflictException(`Kode vendor ${dto.kode_vendor} sudah digunakan`);
            }
        }

        // 2. Validasi unik: pic_email
        const existingPicEmail = await this.vendorModel.findOne({
            where: { pic_email: dto.pic_email.toLowerCase().trim() },
        });
        if (existingPicEmail) {
            throw new ConflictException(`Email PIC ${dto.pic_email} sudah terdaftar`);
        }

        // 3. Generate kode_vendor otomatis jika tidak diisi
        let kodeVendor = dto.kode_vendor;
        if (!kodeVendor) {
            kodeVendor = await this.generateKodeVendor(dto.nama_vendor);
        }

        // 4. Normalisasi data
        const vendorData: any = {
            nama_vendor: dto.nama_vendor.trim(),
            kode_vendor: kodeVendor,
            alamat_vendor: dto.alamat_vendor?.trim() || null,
            pic_nama: dto.pic_nama.trim(),
            pic_telepon: dto.pic_telepon.trim(),
            pic_email: dto.pic_email.toLowerCase().trim(),
            jenis_layanan: dto.jenis_layanan && dto.jenis_layanan.length > 0 ? dto.jenis_layanan : null,
            status_vendor: dto.status_vendor || 'Dalam Proses',
            area_coverage: dto.area_coverage || [],
            catatan: dto.catatan?.trim() || null,
            aktif: 1,
        };

        // 5. Simpan ke database
        const vendor = await this.vendorModel.create(vendorData);

        this.logger.log(`Vendor baru berhasil dibuat: ${vendor.nama_vendor} (ID: ${vendor.id})`);

        return {
            status: 'success',
            message: `Vendor ${vendor.nama_vendor} berhasil didaftarkan`,
            data: {
                vendor_id: vendor.id,
                nama_vendor: vendor.nama_vendor,
                kode_vendor: vendor.kode_vendor || undefined,
                pic_nama: vendor.pic_nama,
                pic_email: vendor.pic_email,
                status_vendor: vendor.status_vendor,
                created_at: vendor.created_at,
            },
        };
    }

    async getVendorById(id: number) {
        if (!id || isNaN(Number(id))) {
            throw new BadRequestException('ID vendor tidak valid');
        }

        const vendor = await this.vendorModel.findByPk(id, {
            attributes: [
                'id',
                'nama_vendor',
                'kode_vendor',
                'alamat_vendor',
                'pic_nama',
                'pic_telepon',
                'pic_email',
                'jenis_layanan',
                'status_vendor',
                'area_coverage',
                'catatan',
                'aktif',
                'created_at',
                'updated_at',
            ],
        });

        if (!vendor) {
            throw new BadRequestException('Vendor tidak ditemukan');
        }

        return {
            message: 'Detail vendor berhasil diambil',
            data: {
                id: vendor.getDataValue('id'),
                nama_vendor: vendor.getDataValue('nama_vendor'),
                kode_vendor: vendor.getDataValue('kode_vendor') || undefined,
                alamat_vendor: vendor.getDataValue('alamat_vendor') || undefined,
                pic_nama: vendor.getDataValue('pic_nama'),
                pic_telepon: vendor.getDataValue('pic_telepon'),
                pic_email: vendor.getDataValue('pic_email'),
                jenis_layanan: vendor.getDataValue('jenis_layanan') || [],
                status_vendor: vendor.getDataValue('status_vendor'),
                area_coverage: vendor.getDataValue('area_coverage') || [],
                catatan: vendor.getDataValue('catatan') || undefined,
                aktif: vendor.getDataValue('aktif'),
                created_at: vendor.getDataValue('created_at'),
                updated_at: vendor.getDataValue('updated_at'),
            }
        };
    }

    async approveVendor(id: number) {
        if (!id || isNaN(Number(id))) {
            throw new BadRequestException('ID vendor tidak valid');
        }

        const vendor = await this.vendorModel.findByPk(id, {
            attributes: ['id', 'nama_vendor', 'status_vendor']
        });
        if (!vendor) {
            throw new BadRequestException('Vendor tidak ditemukan');
        }

        const currentStatus = vendor.getDataValue('status_vendor');
        if (currentStatus === 'Aktif') {
            return {
                message: `Vendor ${vendor.getDataValue('nama_vendor')} sudah berstatus Aktif`,
                data: {
                    id: vendor.getDataValue('id'),
                    nama_vendor: vendor.getDataValue('nama_vendor'),
                    status_vendor: currentStatus
                }
            };
        }

        await this.vendorModel.update({
            status_vendor: 'Aktif',
            updated_at: new Date(),
        }, {
            where: { id }
        });

        return {
            message: `Vendor ${vendor.getDataValue('nama_vendor')} berhasil diubah menjadi Aktif`,
            data: {
                id: vendor.getDataValue('id'),
                nama_vendor: vendor.getDataValue('nama_vendor'),
                status_vendor: 'Aktif'
            }
        };
    }

    async updateVendor(id: number, dto: UpdateVendorDto) {
        if (!id || isNaN(Number(id))) {
            throw new BadRequestException('ID vendor tidak valid');
        }

        const vendor = await this.vendorModel.findByPk(id);
        if (!vendor) {
            throw new NotFoundException('Vendor tidak ditemukan');
        }

        // Validasi unik: kode_vendor (jika diubah)
        if (dto.kode_vendor) {
            const existingKode = await this.vendorModel.findOne({
                where: {
                    kode_vendor: dto.kode_vendor,
                    id: { [Op.ne]: id },
                },
            });
            if (existingKode) {
                throw new ConflictException(`Kode vendor ${dto.kode_vendor} sudah digunakan`);
            }
        }

        // Validasi unik: pic_email (jika diubah)
        if (dto.pic_email) {
            const normalizedEmail = dto.pic_email.toLowerCase().trim();
            const existingPicEmail = await this.vendorModel.findOne({
                where: {
                    pic_email: normalizedEmail,
                    id: { [Op.ne]: id },
                },
            });
            if (existingPicEmail) {
                throw new ConflictException(`Email PIC ${dto.pic_email} sudah terdaftar`);
            }
        }

        const updateData: any = {
            updated_at: new Date(),
        };

        if (dto.nama_vendor !== undefined) updateData.nama_vendor = dto.nama_vendor.trim();
        if (dto.kode_vendor !== undefined) updateData.kode_vendor = dto.kode_vendor;
        if (dto.alamat_vendor !== undefined) updateData.alamat_vendor = dto.alamat_vendor?.trim() || null;
        if (dto.pic_nama !== undefined) updateData.pic_nama = dto.pic_nama.trim();
        if (dto.pic_telepon !== undefined) updateData.pic_telepon = dto.pic_telepon.trim();
        if (dto.pic_email !== undefined) updateData.pic_email = dto.pic_email.toLowerCase().trim();
        if (dto.jenis_layanan !== undefined) updateData.jenis_layanan = dto.jenis_layanan.length > 0 ? dto.jenis_layanan : null;
        if (dto.status_vendor !== undefined) updateData.status_vendor = dto.status_vendor;
        if (dto.area_coverage !== undefined) updateData.area_coverage = dto.area_coverage;
        if (dto.catatan !== undefined) updateData.catatan = dto.catatan?.trim() || null;

        await this.vendorModel.update(updateData, { where: { id } });

        return {
            message: 'Vendor berhasil diupdate',
            data: {
                id,
                ...updateData,
            },
        };
    }

    /**
     * Soft delete: nonaktifkan vendor agar tidak merusak relasi ke orders.
     */
    async deleteVendor(id: number) {
        if (!id || isNaN(Number(id))) {
            throw new BadRequestException('ID vendor tidak valid');
        }

        const vendor = await this.vendorModel.findByPk(id, {
            attributes: ['id', 'nama_vendor', 'aktif', 'status_vendor'],
        });
        if (!vendor) {
            throw new NotFoundException('Vendor tidak ditemukan');
        }

        if (vendor.getDataValue('aktif') === 0) {
            return {
                message: `Vendor ${vendor.getDataValue('nama_vendor')} sudah nonaktif`,
                data: { id, aktif: 0, status_vendor: vendor.getDataValue('status_vendor') },
            };
        }

        await this.vendorModel.update(
            {
                aktif: 0,
                status_vendor: 'Nonaktif',
                updated_at: new Date(),
            },
            { where: { id } }
        );

        return {
            message: `Vendor ${vendor.getDataValue('nama_vendor')} berhasil dihapus (dinonaktifkan)`,
            data: { id, aktif: 0, status_vendor: 'Nonaktif' },
        };
    }

    /**
     * Generate kode vendor otomatis (contoh: VND-001, VND-002)
     */
    private async generateKodeVendor(namaVendor: string): Promise<string> {
        const prefix = 'VND';
        const existingVendors = await this.vendorModel.findAll({
            where: {
                kode_vendor: { [Op.like]: `${prefix}-%` },
            },
            order: [['id', 'DESC']],
            limit: 1,
        });

        let nextNumber = 1;
        if (existingVendors.length > 0) {
            const lastKode = existingVendors[0].getDataValue('kode_vendor');
            if (lastKode) {
                const match = lastKode.match(/\d+/);
                if (match) {
                    nextNumber = parseInt(match[0], 10) + 1;
                }
            }
        }
        return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
    }

    async listVendors(query: ListVendorsQueryDto): Promise<ListVendorsResponseDto> {
        // 1. Buat filter berdasarkan search
        const where: any = {};

        if (query.search) {
            where[Op.or] = [
                { nama_vendor: { [Op.like]: `%${query.search}%` } },
                { kode_vendor: { [Op.like]: `%${query.search}%` } },
                { pic_nama: { [Op.like]: `%${query.search}%` } },
                { pic_email: { [Op.like]: `%${query.search}%` } },
                { pic_telepon: { [Op.like]: `%${query.search}%` } },
            ];
        }

        // 2. Filter berdasarkan status_vendor
        if (query.status_vendor) {
            where.status_vendor = query.status_vendor;
        }

        // 3. Filter berdasarkan jenis_layanan (JSON contains)
        if (query.jenis_layanan) {
            where.jenis_layanan = { [Op.like]: `%${query.jenis_layanan}%` };
        }

        // 4. Hitung total items untuk pagination
        const totalItems = await this.vendorModel.count({ where });

        // 5. Pagination
        const limit = query.limit || 20;
        const page = query.page || 1;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;

        // 6. Ambil data vendors dengan pagination
        const vendors = await this.vendorModel.findAll({
            where,
            attributes: [
                'id',
                'nama_vendor',
                'kode_vendor',
                'pic_nama',
                'pic_telepon',
                'pic_email',
                'jenis_layanan',
                'status_vendor',
                'area_coverage',
                'aktif',
                'created_at',
                'updated_at',
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        // 7. Transform data ke format response
        const vendorsList: VendorListItemDto[] = vendors.map((vendor) => ({
            no: vendor.getDataValue('id'),
            kode: vendor.getDataValue('kode_vendor') || '-',
            nama: vendor.getDataValue('nama_vendor'),
            pic: vendor.getDataValue('pic_nama'),
            telepon: vendor.getDataValue('pic_telepon'),
            layanan: vendor.getDataValue('jenis_layanan') && vendor.getDataValue('jenis_layanan').length > 0
                ? vendor.getDataValue('jenis_layanan').join(', ')
                : '-',
            status: vendor.getDataValue('status_vendor'),
        }));

        // 8. Buat response pagination
        const pagination: PaginationDto = {
            current_page: page,
            limit: limit,
            total_items: totalItems,
            total_pages: totalPages,
        };

        return {
            message: 'Daftar vendor berhasil diambil',
            data: {
                pagination,
                vendors: vendorsList,
            },
        };
    }
}

