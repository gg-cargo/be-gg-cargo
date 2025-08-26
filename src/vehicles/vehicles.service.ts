import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TruckList } from '../models/truck-list.model';
import { VehiclesQueryDto, VehiclesResponseDto, VehicleDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
    private readonly logger = new Logger(VehiclesService.name);

    constructor(
        @InjectModel(TruckList)
        private readonly truckListModel: typeof TruckList,
    ) { }

    async getVehicles(query: VehiclesQueryDto): Promise<VehiclesResponseDto> {
        const { search, status } = query;

        const whereCondition: any = {};

        if (search) {
            whereCondition[Op.or] = [
                { no_polisi: { [Op.like]: `%${search}%` } },
                { jenis_mobil: { [Op.like]: `%${search}%` } },
            ];
        }

        if (status !== undefined && status !== null) {
            whereCondition.status = status;
        }

        try {
            const vehicles = await this.truckListModel.findAll({
                where: whereCondition,
                attributes: [
                    'id',
                    'no_polisi',
                    'jenis_mobil',
                    'max_berat',
                    'max_volume',
                    'type',
                    'status',
                ],
                order: [['jenis_mobil', 'ASC']],
                raw: true,
            });

            const data: VehicleDto[] = vehicles.map((v) => ({
                id: v.id,
                no_polisi: v.no_polisi ?? null,
                jenis_mobil: v.jenis_mobil ?? null,
                max_berat: v.max_berat ?? null,
                max_volume: v.max_volume ?? null,
                type: v.type,
                status: v.status ?? null,
            }));

            return {
                status: 'success',
                vehicles: data,
            };
        } catch (error) {
            this.logger.error(`Error in getVehicles: ${error.message}`, error.stack);
            throw error;
        }
    }
}
