import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Service } from '../models/service.model';
import { CreateServiceDto } from '../services-master/dto/create-service.dto';
import { UpdateServiceDto } from '../services-master/dto/update-service.dto';
import { SubService } from '../models/sub-service.model';

@Injectable()
export class ServicesService {
    constructor(
        @InjectModel(Service)
        private readonly serviceModel: typeof Service,
    ) { }

    async findAll(params: { page?: number; limit?: number; search?: string; is_active?: string }) {
        const page = params.page && params.page > 0 ? (params.page * 1) : 1;
        const limit = params.limit && params.limit > 0 && params.limit <= 200 ? (params.limit * 1) : 20;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (params.is_active !== undefined) {
            where.is_active = params.is_active === 'true';
        }

        if (params.search) {
            where[Op.or] = [
                { service_name: { [Op.like]: `%${params.search}%` } },
                { service_code: { [Op.like]: `%${params.search}%` } },
            ];
        }

        const { rows, count } = await this.serviceModel.findAndCountAll({
            where,
            include: [SubService],
            offset,
            limit,
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });

        return { data: rows, total: count, page, limit };
    }

    async findOne(id: string): Promise<Service> {
        const service = await this.serviceModel.findByPk(id, {
            include: [SubService]
        });
        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }
        return service;
    }

    async create(createServiceDto: CreateServiceDto): Promise<Service> {
        // Uniqueness check for code
        const existing = await this.serviceModel.findOne({ where: { service_code: createServiceDto.service_code } });
        if (existing) {
            throw new BadRequestException(`Service code ${createServiceDto.service_code} already exists`);
        }

        return this.serviceModel.create(createServiceDto as any);
    }

    async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
        const service = await this.findOne(id);

        if (updateServiceDto.service_code && updateServiceDto.service_code !== service.service_code) {
            const existing = await this.serviceModel.findOne({ where: { service_code: updateServiceDto.service_code } });
            if (existing) {
                throw new BadRequestException(`Service code ${updateServiceDto.service_code} already exists`);
            }
        }

        return service.update(updateServiceDto);
    }

    async remove(id: string): Promise<void> {
        const service = await this.findOne(id);
        await service.destroy();
    }
}
