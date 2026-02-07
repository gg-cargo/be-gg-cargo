import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { SubService } from '../models/sub-service.model';
import { CreateSubServiceDto } from '../services-master/dto/create-sub-service.dto';
import { UpdateSubServiceDto } from '../services-master/dto/update-sub-service.dto';
import { Service } from '../models/service.model';

@Injectable()
export class SubServicesService {
    constructor(
        @InjectModel(SubService)
        private readonly subServiceModel: typeof SubService,
        @InjectModel(Service)
        private readonly serviceModel: typeof Service,
    ) { }

    async findAll(params: { page?: number; limit?: number; search?: string; service_id?: string }) {
        const page = params.page && params.page > 0 ? (params.page * 1) : 1;
        const limit = params.limit && params.limit > 0 && params.limit <= 200 ? (params.limit * 1) : 20;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (params.service_id) {
            where.service_id = params.service_id;
        }

        if (params.search) {
            where[Op.or] = [
                { sub_service_name: { [Op.like]: `%${params.search}%` } },
            ];
        }

        const { rows, count } = await this.subServiceModel.findAndCountAll({
            where,
            include: [Service],
            offset,
            limit,
            order: [['created_at', 'DESC']]
        });

        return { data: rows, total: count, page, limit };
    }

    async findOne(id: string): Promise<SubService> {
        const subService = await this.subServiceModel.findByPk(id, {
            include: [Service]
        });
        if (!subService) {
            throw new NotFoundException(`Sub Service with ID ${id} not found`);
        }
        return subService;
    }

    async create(createSubServiceDto: CreateSubServiceDto): Promise<SubService> {
        // Validate Service Exists
        const service = await this.serviceModel.findByPk(createSubServiceDto.service_id);
        if (!service) {
            throw new NotFoundException(`Service with ID ${createSubServiceDto.service_id} not found`);
        }

        // Uniqueness check
        const existing = await this.subServiceModel.findOne({
            where: { sub_service_name: createSubServiceDto.sub_service_name }
        });
        if (existing) {
            throw new BadRequestException(`Sub Service name ${createSubServiceDto.sub_service_name} already exists`);
        }

        return this.subServiceModel.create(createSubServiceDto as any);
    }

    async update(id: string, updateSubServiceDto: UpdateSubServiceDto): Promise<SubService> {
        const subService = await this.findOne(id);

        if (updateSubServiceDto.service_id) {
            const service = await this.serviceModel.findByPk(updateSubServiceDto.service_id);
            if (!service) {
                throw new NotFoundException(`Service with ID ${updateSubServiceDto.service_id} not found`);
            }
        }

        if (updateSubServiceDto.sub_service_name && updateSubServiceDto.sub_service_name !== subService.sub_service_name) {
            const existing = await this.subServiceModel.findOne({
                where: { sub_service_name: updateSubServiceDto.sub_service_name }
            });
            if (existing) {
                throw new BadRequestException(`Sub Service name ${updateSubServiceDto.sub_service_name} already exists`);
            }
        }

        return subService.update(updateSubServiceDto);
    }

    async remove(id: string): Promise<void> {
        const subService = await this.findOne(id);
        await subService.destroy();
    }
}
