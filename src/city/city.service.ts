import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { City } from '../models/city.model';

@Injectable()
export class CityService {
    constructor(
        @InjectModel(City)
        private cityModel: typeof City,
    ) { }

    async searchCity(query: string, origin?: string, destination?: string) {
        const searchQuery = `%${query}%`;

        // Build where condition
        const whereCondition: any = {
            [Op.or]: [
                { provinsi: { [Op.like]: searchQuery } },
                { kota: { [Op.like]: searchQuery } },
                { kecamatan: { [Op.like]: searchQuery } },
                { kelurahan: { [Op.like]: searchQuery } },
                { kode_pos: { [Op.like]: searchQuery } },
            ],
        };

        // Add origin filter
        if (origin === 'true') {
            whereCondition.is_origin = true;
            whereCondition.coverage_status = { [Op.in]: ['active', 'limited'] };
        }

        // Add destination filter
        if (destination === 'true') {
            whereCondition.is_destination = true;
            whereCondition.coverage_status = { [Op.in]: ['active', 'limited'] };
        }

        const results = await this.cityModel.findAll({
            where: whereCondition,
            order: [
                ['provinsi', 'ASC'],
                ['kota', 'ASC'],
                ['kecamatan', 'ASC'],
                ['kelurahan', 'ASC'],
            ],
        });

        let message = 'Data berhasil diambil';
        let type = 'all';

        if (origin === 'true' && destination === 'true') {
            message = 'Data kota asal dan tujuan berhasil diambil';
            type = 'both';
        } else if (origin === 'true') {
            message = 'Data kota asal berhasil diambil';
            type = 'origin';
        } else if (destination === 'true') {
            message = 'Data kota tujuan berhasil diambil';
            type = 'destination';
        }

        return {
            message: message,
            success: true,
            data: results,
            total: results.length,
            query: query,
            type: type,
            filters: {
                origin: origin === 'true',
                destination: destination === 'true'
            }
        };
    }
} 