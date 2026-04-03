import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { City } from '../models/city.model';
import { Hub } from '../models/hub.model';
import { BulkAssignHubOriginDto } from './dto/bulk-assign-hub-origin.dto';

@Injectable()
export class CityService {
    constructor(
        @InjectModel(City)
        private cityModel: typeof City,
        @InjectModel(Hub)
        private hubModel: typeof Hub,
    ) { }

    async searchCity(
        query?: string,
        origin?: string,
        destination?: string,
        cityOnly?: string,
        page: number = 1,
        limit: number = 20,
    ) {
        const searchQuery = `%${query || ''}%`;
        const hasQuery = Boolean(query && query.length > 0);
        const isCityOnly = cityOnly === 'true';

        // Build where condition
        const whereCondition: any = {};

        if (hasQuery) {
            if (isCityOnly) {
                whereCondition.kota = { [Op.like]: searchQuery };
            } else {
                whereCondition[Op.or] = [
                    { provinsi: { [Op.like]: searchQuery } },
                    { kota: { [Op.like]: searchQuery } },
                    { kecamatan: { [Op.like]: searchQuery } },
                    { kelurahan: { [Op.like]: searchQuery } },
                    { kode_pos: { [Op.like]: searchQuery } },
                ];
            }
        }

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

        let results: any[] = [];
        let total = 0;

        if (hasQuery) {
            results = await this.cityModel.findAll({
                where: whereCondition,
                order: [
                    ['provinsi', 'ASC'],
                    ['kota', 'ASC'],
                    ['kecamatan', 'ASC'],
                    ['kelurahan', 'ASC'],
                ],
            });
            total = results.length;
        } else {
            const offset = (page - 1) * limit;
            const paged = await this.cityModel.findAndCountAll({
                where: whereCondition,
                order: [
                    ['provinsi', 'ASC'],
                    ['kota', 'ASC'],
                    ['kecamatan', 'ASC'],
                    ['kelurahan', 'ASC'],
                ],
                limit,
                offset,
            });
            results = paged.rows;
            total = paged.count;
        }

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
            total,
            query: query,
            type: type,
            ...(hasQuery ? {} : {
                pagination: {
                    page,
                    limit,
                    total_pages: Math.ceil(total / limit),
                },
            }),
            filters: {
                origin: origin === 'true',
                destination: destination === 'true',
                city_only: isCityOnly,
            }
        };
    }

    async bulkAssignHubOrigin(payload: BulkAssignHubOriginDto) {
        const { hub_origin, city_ids } = payload;

        const hub = await this.hubModel.findByPk(hub_origin, {
            attributes: ['id', 'kode', 'nama'],
        });
        if (!hub) {
            throw new NotFoundException(`Hub dengan ID ${hub_origin} tidak ditemukan`);
        }

        const uniqueCityIds = Array.from(new Set(city_ids.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)));
        if (!uniqueCityIds.length) {
            throw new BadRequestException('city_ids tidak valid');
        }

        const existingCities = await this.cityModel.findAll({
            where: { id: uniqueCityIds },
            attributes: ['id'],
            raw: true,
        });

        const foundIdSet = new Set(existingCities.map((city) => Number(city.id)));
        const notFoundCityIds = uniqueCityIds.filter((id) => !foundIdSet.has(id));

        await this.cityModel.update(
            { hub_origin },
            { where: { id: { [Op.in]: uniqueCityIds } } }
        );

        return {
            message: 'Bulk assign hub_origin berhasil',
            success: true,
            data: {
                hub_origin: {
                    id: hub.getDataValue('id'),
                    kode: hub.getDataValue('kode'),
                    nama: hub.getDataValue('nama'),
                },
                requested_city_ids: uniqueCityIds,
                assigned_count: existingCities.length,
                assigned_city_ids: Array.from(foundIdSet),
                not_found_city_ids: notFoundCityIds,
            },
        };
    }
}