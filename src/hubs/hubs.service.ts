import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Hub } from '../models/hub.model';
import { User } from '../models/user.model';
import { HubListQueryDto, HubListResponseDto, HubDataDto } from './dto/hub-list.dto';

@Injectable()
export class HubsService {
    private readonly logger = new Logger(HubsService.name);

    constructor(
        @InjectModel(Hub)
        private readonly hubModel: typeof Hub,
        @InjectModel(User)
        private readonly userModel: typeof User,
    ) { }

    /**
     * Mengambil daftar semua hub dengan search (tanpa pagination)
     */
    async getHubList(query: HubListQueryDto): Promise<HubListResponseDto> {
        const { search, user_id } = query;

        // Build where condition
        const whereCondition: any = {};

        if (search) {
            whereCondition[Op.or] = [
                { nama: { [Op.like]: `%${search}%` } },
                { kode: { [Op.like]: `%${search}%` } },
            ];
        }

        // Filter berdasarkan user_id dan level traffic controller
        if (user_id) {
            try {
                // Cek apakah user ada dan levelnya adalah traffic controller (level = 9)
                const user = await this.userModel.findByPk(user_id, {
                    attributes: ['id', 'level', 'hub_id']
                });

                if (user) {
                    const userLevel = user.getDataValue('level');
                    const userHubId = user.getDataValue('hub_id');

                    if (user_id === 10) {
                        Object.keys(whereCondition).forEach(key => delete whereCondition[key]);
                        if (search) {
                            whereCondition[Op.or] = [
                                { nama: { [Op.like]: `%${search}%` } },
                                { kode: { [Op.like]: `%${search}%` } },
                            ];
                        }
                    } else if (userLevel === 9) {
                        let groupFilter = '';

                        if (userHubId === 1) {
                            groupFilter = 'JW';
                        } else if (userHubId === 4) {
                            groupFilter = 'SM';
                        }

                        if (groupFilter) {
                            // Tambahkan filter group_id ke whereCondition
                            if (whereCondition[Op.or]) {
                                // Jika sudah ada Op.or, buat Op.and untuk menggabungkan
                                whereCondition[Op.and] = [
                                    { [Op.or]: whereCondition[Op.or] },
                                    { group_id: { [Op.like]: `${groupFilter}%` } }
                                ];
                                delete whereCondition[Op.or];
                            } else {
                                whereCondition.group_id = { [Op.like]: `${groupFilter}%` };
                            }
                        }
                    }
                }
            } catch (error) {
                this.logger.error(`Error checking user level for traffic controller: ${error.message}`);
                // Jika error, tetap lanjut tanpa filter khusus
            }
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
