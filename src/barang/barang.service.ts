import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Barang } from '../models/barang.model';
import { CreateBarangDto } from './dto/create-barang.dto';
import { UpdateBarangDto } from './dto/update-barang.dto';
import { Op } from 'sequelize';

@Injectable()
export class BarangService {
    private readonly logger = new Logger(BarangService.name);

    constructor(
        @InjectModel(Barang)
        private readonly barangModel: typeof Barang,
    ) { }

    async create(dto: CreateBarangDto) {
        const barang = await this.barangModel.create({
            nama_barang: dto.nama_barang.trim(),
        } as any);
        this.logger.log(`Barang berhasil dibuat: ${barang.getDataValue('nama_barang')} (ID: ${barang.getDataValue('id')})`);
        return {
            message: 'Barang berhasil dibuat',
            data: {
                id: barang.getDataValue('id'),
                nama_barang: barang.getDataValue('nama_barang'),
            },
        };
    }

    async findAll(search?: string) {
        const where: any = {};
        if (search && search.trim()) {
            where.nama_barang = { [Op.like]: `%${search.trim()}%` };
        }
        const items = await this.barangModel.findAll({
            where,
            attributes: ['id', 'nama_barang', 'createdAt', 'updatedAt'],
            order: [['nama_barang', 'ASC']],
        });
        return {
            message: 'Daftar barang berhasil diambil',
            data: items.map((b) => ({
                id: b.getDataValue('id'),
                nama_barang: b.getDataValue('nama_barang'),
                created_at: b.getDataValue('createdAt'),
                updated_at: b.getDataValue('updatedAt'),
            })),
        };
    }

    async findOne(id: number) {
        if (!id || isNaN(Number(id))) {
            throw new BadRequestException('ID barang tidak valid');
        }
        const barang = await this.barangModel.findByPk(id);
        if (!barang) {
            throw new NotFoundException('Barang tidak ditemukan');
        }
        return {
            message: 'Detail barang berhasil diambil',
            data: {
                id: barang.getDataValue('id'),
                nama_barang: barang.getDataValue('nama_barang'),
                created_at: barang.getDataValue('createdAt'),
                updated_at: barang.getDataValue('updatedAt'),
            },
        };
    }

    async update(id: number, dto: UpdateBarangDto) {
        const barang = await this.barangModel.findByPk(id);
        if (!barang) {
            throw new NotFoundException('Barang tidak ditemukan');
        }
        if (dto.nama_barang !== undefined) {
            barang.setDataValue('nama_barang', dto.nama_barang.trim());
        }
        await barang.save();
        this.logger.log(`Barang berhasil diupdate: ID ${id}`);
        return {
            message: 'Barang berhasil diupdate',
            data: {
                id: barang.getDataValue('id'),
                nama_barang: barang.getDataValue('nama_barang'),
            },
        };
    }

    async remove(id: number) {
        const barang = await this.barangModel.findByPk(id);
        if (!barang) {
            throw new NotFoundException('Barang tidak ditemukan');
        }
        await barang.destroy();
        this.logger.log(`Barang berhasil dihapus: ID ${id}`);
        return {
            message: 'Barang berhasil dihapus',
        };
    }
}
