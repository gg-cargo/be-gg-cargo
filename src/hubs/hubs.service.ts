import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Hub } from '../models/hub.model';
import { HubListQueryDto, HubListResponseDto, HubDataDto } from './dto/hub-list.dto';

@Injectable()
export class HubsService {
    private readonly logger = new Logger(HubsService.name);

    constructor(
        @InjectModel(Hub)
        private readonly hubModel: typeof Hub,
    ) { }

    /**
     * Mengambil daftar semua hub dengan search (tanpa pagination)
     */
    async getHubList(query: HubListQueryDto): Promise<HubListResponseDto> {
        const { search } = query;

        // Build where condition
        const whereCondition: any = {};

        if (search) {
            whereCondition[Op.or] = [
                { nama: { [Op.like]: `%${search}%` } },
                { kode: { [Op.like]: `%${search}%` } },
            ];
        }

        try {
            // Query untuk semua data hub
            const hubs = await this.hubModel.findAll({
                where: whereCondition,
                attributes: [
                    'id',
                    'kode',
                    'nama',
                    'alamat',
                    'phone',
                    'latLang',
                    'group_id',
                ],
                order: [['nama', 'ASC']],
                raw: true,
            });

            // Format response data
            const hubsData: HubDataDto[] = hubs.map(hub => ({
                id: hub.id,
                kode: hub.kode,
                nama: hub.nama,
                alamat: hub.alamat,
                phone: hub.phone,
                latLang: hub.latLang,
                group_id: hub.group_id,
            }));

            return {
                status: 'success',
                total_items: hubsData.length,
                hubs: hubsData,
            };

        } catch (error) {
            this.logger.error(`Error in getHubList: ${error.message}`, error.stack);
            throw error;
        }
    }
}
