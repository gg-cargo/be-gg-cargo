import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MasterTarif } from '../models/master-tarif.model';
import { TariffWeightTier } from '../models/tarif-weight-tier.model';
import { TariffRoutePrice } from '../models/tarif-route-price.model';
import { TariffDistance } from '../models/tarif-distance.model';
import { TariffVehicleDaily } from '../models/tarif-vehicle-daily.model';
import { TariffSeaFreight } from '../models/tarif-sea-freight.model';
import { TariffSurcharge } from '../models/tarif-surcharge.model';
import { BulkCreateTariffDto, CreateTariffDto } from './dto/bulk-create-tariff.dto';
import { GetTariffsFilterDto } from './dto/get-tariffs-filter.dto';
import { UpdateTariffStatusDto } from './dto/update-tariff-status.dto';
import { Sequelize } from 'sequelize-typescript';
import { Op, fn, col } from 'sequelize';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class TariffsService {
    private readonly logger = new Logger(TariffsService.name);

    constructor(
        @InjectModel(MasterTarif)
        private masterTarifModel: typeof MasterTarif,
        @InjectModel(TariffWeightTier)
        private tariffWeightTierModel: typeof TariffWeightTier,
        @InjectModel(TariffRoutePrice)
        private tariffRoutePriceModel: typeof TariffRoutePrice,
        @InjectModel(TariffDistance)
        private tariffDistanceModel: typeof TariffDistance,
        @InjectModel(TariffVehicleDaily)
        private tariffVehicleDailyModel: typeof TariffVehicleDaily,
        @InjectModel(TariffSeaFreight)
        private tariffSeaFreightModel: typeof TariffSeaFreight,
        @InjectModel(TariffSurcharge)
        private tariffSurchargeModel: typeof TariffSurcharge,
        private sequelize: Sequelize,
    ) { }

    async bulkCreate(dto: BulkCreateTariffDto) {
        const transaction = await this.sequelize.transaction();
        const createdTariffIds: string[] = [];
        const errors: any[] = [];

        try {
            for (let i = 0; i < dto.bulk_tariffs.length; i++) {
                const tariffDto = dto.bulk_tariffs[i];

                try {
                    // Validate pricing model specific requirements
                    this.validatePricingModelData(tariffDto, i + 1);

                    // Generate tariff_id
                    const tariffId = this.generateTariffId();

                    // Create master tariff
                    await this.masterTarifModel.create({
                        tariff_id: tariffId,
                        service_type: tariffDto.service_type,
                        sub_service: tariffDto.sub_service,
                        tariff_name: tariffDto.tariff_name,
                        pricing_model: tariffDto.pricing_model,
                        customer_id: tariffDto.customer_id || null,
                        origin_zone: tariffDto.origin_zone || null,
                        destination_zone: tariffDto.destination_zone || null,
                        vehicle_type: tariffDto.vehicle_type || null,
                        currency: tariffDto.currency,
                        min_charge: tariffDto.min_charge,
                        sla_hours: tariffDto.sla_hours || null,
                        is_active: tariffDto.is_active,
                        effective_start: tariffDto.effective_start,
                        effective_end: tariffDto.effective_end || null,
                    } as any, { transaction });

                    // Create related records based on pricing model
                    await this.createRelatedRecords(tariffId, tariffDto, transaction);

                    createdTariffIds.push(tariffId);
                } catch (error) {
                    errors.push({
                        row: i + 1,
                        tariff_name: tariffDto.tariff_name,
                        error: error.message,
                    });
                }
            }

            if (errors.length > 0) {
                const errorMessage = errors.map(e => `Row ${e.row} (${e.tariff_name}): ${e.error}`).join('; ');
                throw new BadRequestException({
                    message: `Bulk create failed: ${errorMessage}`,
                    errors,
                });
            }

            await transaction.commit();

            return {
                created_count: createdTariffIds.length,
                tariff_ids: createdTariffIds,
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private validatePricingModelData(dto: CreateTariffDto, rowNumber: number) {
        switch (dto.pricing_model) {
            case 'WEIGHT_BASED':
                if (!dto.weight_tiers || dto.weight_tiers.length === 0) {
                    throw new BadRequestException(
                        `Row ${rowNumber}: Weight tiers are required for WEIGHT_BASED pricing model`,
                    );
                }
                break;
            case 'ROUTE_BASED':
                if (!dto.route_prices || dto.route_prices.length === 0) {
                    throw new BadRequestException(
                        `Row ${rowNumber}: Route prices are required for ROUTE_BASED pricing model`,
                    );
                }
                break;
            case 'DISTANCE_BASED':
                if (!dto.distance_config) {
                    throw new BadRequestException(
                        `Row ${rowNumber}: Distance config is required for DISTANCE_BASED pricing model`,
                    );
                }
                break;
            case 'DAILY_BASED':
                if (!dto.vehicle_daily_rates || dto.vehicle_daily_rates.length === 0) {
                    throw new BadRequestException(
                        `Row ${rowNumber}: Vehicle daily rates are required for DAILY_BASED pricing model`,
                    );
                }
                break;
        }
    }

    private async createRelatedRecords(
        tariffId: string,
        dto: CreateTariffDto,
        transaction: any,
    ) {
        // Create weight tiers
        if (dto.weight_tiers && dto.weight_tiers.length > 0) {
            for (const tier of dto.weight_tiers) {
                await this.tariffWeightTierModel.create({
                    tier_id: this.generateId('TIER'),
                    tariff_id: tariffId,
                    min_weight_kg: tier.min_weight_kg,
                    max_weight_kg: tier.max_weight_kg,
                    rate_per_kg: tier.rate_per_kg,
                } as any, { transaction });
            }
        }

        // Create route prices
        if (dto.route_prices && dto.route_prices.length > 0) {
            for (const route of dto.route_prices) {
                await this.tariffRoutePriceModel.create({
                    route_price_id: this.generateId('ROUTE'),
                    tariff_id: tariffId,
                    origin_city: route.origin_city,
                    destination_city: route.destination_city,
                    item_type: route.item_type || null,
                    price: route.price,
                } as any, { transaction });
            }
        }

        // Create distance config
        if (dto.distance_config) {
            const basePrice = dto.distance_config.base_price || 0;
            const distanceTiers = dto.distance_config.distance_tiers;

            if (distanceTiers && distanceTiers.length > 0) {
                // New format: multiple tiers
                for (const tier of distanceTiers) {
                    const distanceId = this.generateId('DIST');
                    await this.tariffDistanceModel.create({
                        distance_id: distanceId,
                        tariff_id: tariffId,
                        base_price: basePrice,
                        rate_per_km: tier.rate_per_km,
                        min_km: tier.min_km || null,
                        max_km: tier.max_km || null,
                    } as any, { transaction });
                }
            } else {
                // Old format: single tier (backward compatibility)
                const distanceId = this.generateId('DIST');
                await this.tariffDistanceModel.create({
                    distance_id: distanceId,
                    tariff_id: tariffId,
                    base_price: basePrice,
                    rate_per_km: dto.distance_config.rate_per_km,
                    min_km: dto.distance_config.min_km || null,
                    max_km: dto.distance_config.max_km || null,
                } as any, { transaction });
            }
        }

        // Create vehicle daily rates
        if (dto.vehicle_daily_rates && dto.vehicle_daily_rates.length > 0) {
            for (const daily of dto.vehicle_daily_rates) {
                await this.tariffVehicleDailyModel.create({
                    daily_id: this.generateId('DAILY'),
                    tariff_id: tariffId,
                    vehicle_type: daily.vehicle_type,
                    daily_rate: daily.daily_rate,
                    max_hours: daily.max_hours || null,
                } as any, { transaction });
            }
        }

        // Create sea freight config
        if (dto.sea_freight_config) {
            await this.tariffSeaFreightModel.create({
                sea_id: this.generateId('SEA'),
                tariff_id: tariffId,
                origin_port: dto.sea_freight_config.origin_port,
                destination_port: dto.sea_freight_config.destination_port,
                rate_per_cbm: dto.sea_freight_config.rate_per_cbm,
                currency: dto.sea_freight_config.currency,
            } as any, { transaction });
        }

        // Create surcharges
        if (dto.surcharges && dto.surcharges.length > 0) {
            for (const surcharge of dto.surcharges) {
                await this.tariffSurchargeModel.create({
                    surcharge_id: this.generateId('SUR'),
                    tariff_id: tariffId,
                    surcharge_type: surcharge.surcharge_type,
                    calculation: surcharge.calculation,
                    value: surcharge.value,
                    condition: surcharge.condition || null,
                } as any, { transaction });
            }
        }
    }

    private generateTariffId(): string {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TRF-${timestamp}${random}`;
    }

    private generateId(prefix: string): string {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}${random}`;
    }

    async parseExcel(filePath: string) {
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new BadRequestException('File not found');
            }

            // Read Excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new BadRequestException('No data found in Excel file');
            }

            // Convert to JSON (array of arrays)
            const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rawData.length < 2) {
                throw new BadRequestException('Excel file must contain at least header and one data row');
            }

            // Parse and validate data
            const parsedRows: any[] = [];
            const errors: any[] = [];

            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];

                // Skip empty rows
                if (!row || !row[0]) continue;

                const rowNum = i + 1;
                const rowData = {
                    row_number: rowNum,
                    origin: String(row[0] || '').trim(),
                    destination: String(row[1] || '').trim(),
                    pricing_model: String(row[2] || '').trim(),
                    base_rate: Number(row[3]) || 0,
                    min_charge: Number(row[4]) || 0,
                    status: 'ok' as 'ok' | 'error',
                    error_message: null as string | null,
                };

                // Validate required fields
                const rowErrors: string[] = [];

                if (!rowData.origin) {
                    rowErrors.push('Origin is required');
                }

                if (!rowData.destination) {
                    rowErrors.push('Destination is required');
                }

                if (!rowData.pricing_model) {
                    rowErrors.push('Pricing Model is required');
                } else {
                    // Validate pricing model value
                    const validModels = ['Weight Based', 'Route Based', 'Distance Based', 'Daily Based'];
                    if (!validModels.includes(rowData.pricing_model)) {
                        rowErrors.push(`Invalid pricing model. Must be one of: ${validModels.join(', ')}`);
                    }
                }

                // Validate numeric fields
                if (isNaN(rowData.base_rate) || rowData.base_rate < 0) {
                    rowErrors.push('Base Rate must be a valid positive number');
                }

                if (isNaN(rowData.min_charge) || rowData.min_charge < 0) {
                    rowErrors.push('Min Charge must be a valid positive number');
                }

                // Set status and error message
                if (rowErrors.length > 0) {
                    rowData.status = 'error';
                    rowData.error_message = rowErrors.join(', ');
                    errors.push({
                        row: rowNum,
                        errors: rowErrors,
                    });
                }

                parsedRows.push(rowData);
            }

            // Delete uploaded file after parsing
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                this.logger.warn(`Failed to delete uploaded file: ${filePath}`);
            }

            return {
                total_rows: parsedRows.length,
                valid_rows: parsedRows.filter(r => r.status === 'ok').length,
                error_rows: parsedRows.filter(r => r.status === 'error').length,
                data: parsedRows,
                errors: errors.length > 0 ? errors : null,
            };
        } catch (error) {
            this.logger.error('Excel parsing error:', error);

            // Clean up file if it exists
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    this.logger.warn(`Failed to delete file on error: ${filePath}`);
                }
            }

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException('Failed to parse Excel file. Please check the format.');
        }
    }

    async findAll(params: GetTariffsFilterDto) {
        const { page = 1, limit = 10, search, service_type, customer_id, is_active, start_date, end_date } = params;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where[Op.or] = [
                { tariff_id: { [Op.like]: `%${search}%` } },
                { tariff_name: { [Op.like]: `%${search}%` } },
                { origin_zone: { [Op.like]: `%${search}%` } },
                { destination_zone: { [Op.like]: `%${search}%` } }
            ];
        }

        if (service_type) where.service_type = service_type;
        if (customer_id) where.customer_id = customer_id;
        if (is_active !== undefined) where.is_active = is_active;
        if (start_date) where.effective_start = { [Op.gte]: start_date };
        if (end_date) where.effective_end = { [Op.lte]: end_date };

        const { rows, count } = await this.masterTarifModel.findAndCountAll({
            where,
            offset,
            limit,
            order: [['created_at', 'DESC']],
        });

        return {
            data: rows,
            total: count,
            page,
            limit
        };
    }

    async findOne(id: string) {
        const tariff = await this.masterTarifModel.findByPk(id, {
            include: [
                { model: this.tariffWeightTierModel },
                { model: this.tariffRoutePriceModel },
                { model: this.tariffDistanceModel },
                { model: this.tariffVehicleDailyModel },
                { model: this.tariffSeaFreightModel },
                { model: this.tariffSurchargeModel }
            ]
        });

        if (!tariff) {
            throw new BadRequestException('Tariff not found');
        }

        return tariff;
    }

    async updateStatus(id: string, dto: UpdateTariffStatusDto) {
        const tariff = await this.findOne(id);
        tariff.setDataValue('is_active', dto.is_active);
        await tariff.save();
        return tariff;
    }

    async remove(id: string) {
        const tariff = await this.findOne(id);

        // Soft delete or hard delete? Assuming hard delete for now as per best practice example, 
        // but typically business apps prefer soft delete. 
        // However, if we cascade, hard delete cleans up related tables.
        // Let's assume transaction is needed for safety if we manually delete related, 
        // but Sequelize constraints might handle it.
        // For simplicity and strict adherence to typical clean-up:

        await tariff.destroy();
    }

    async duplicate(id: string) {
        const original = await this.findOne(id);
        const transaction = await this.sequelize.transaction();

        try {
            const newTariffId = this.generateTariffId();

            // Clone master
            const masterData: any = original.get({ plain: true });
            delete masterData.tariff_id;
            delete masterData.createdAt;
            delete masterData.updatedAt;

            const newTariff = await this.masterTarifModel.create({
                ...masterData,
                tariff_id: newTariffId,
                tariff_name: `${masterData.tariff_name} (Copy)`,
                is_active: false
            } as any, { transaction });

            // Clone relations
            // Weight Tiers
            if (original.getDataValue('weightTiers')?.length) {
                await Promise.all(original.getDataValue('weightTiers').map((t: any) =>
                    this.tariffWeightTierModel.create({
                        ...t.get({ plain: true }),
                        tier_id: this.generateId('TIER'),
                        tariff_id: newTariffId,
                        created_at: undefined, updated_at: undefined
                    } as any, { transaction })
                ));
            }

            // Route Prices
            if (original.getDataValue('routePrices')?.length) {
                await Promise.all(original.getDataValue('routePrices').map((r: any) =>
                    this.tariffRoutePriceModel.create({
                        ...r.get({ plain: true }),
                        route_price_id: this.generateId('ROUTE'),
                        tariff_id: newTariffId,
                        created_at: undefined, updated_at: undefined
                    } as any, { transaction })
                ));
            }

            // Distance
            if (original.getDataValue('distanceConfigs')?.length) {
                await Promise.all(original.getDataValue('distanceConfigs').map((d: any) =>
                    this.tariffDistanceModel.create({
                        ...d.get({ plain: true }),
                        distance_id: this.generateId('DIST'),
                        tariff_id: newTariffId,
                        created_at: undefined, updated_at: undefined
                    } as any, { transaction })
                ));
            }

            // Vehicle Daily
            if (original.getDataValue('dailyRates')?.length) {
                await Promise.all(original.getDataValue('dailyRates').map((v: any) =>
                    this.tariffVehicleDailyModel.create({
                        ...v.get({ plain: true }),
                        daily_id: this.generateId('DAILY'),
                        tariff_id: newTariffId,
                        created_at: undefined, updated_at: undefined
                    } as any, { transaction })
                ));
            }

            // Sea Freight
            if (original.getDataValue('seaFreights')?.length) {
                await Promise.all(original.getDataValue('seaFreights').map((s: any) =>
                    this.tariffSeaFreightModel.create({
                        ...s.get({ plain: true }),
                        sea_id: this.generateId('SEA'),
                        tariff_id: newTariffId,
                        created_at: undefined, updated_at: undefined
                    } as any, { transaction })
                ));
            }

            // Surcharges
            if (original.getDataValue('surcharges')?.length) {
                await Promise.all(original.getDataValue('surcharges').map((s: any) =>
                    this.tariffSurchargeModel.create({
                        ...s.get({ plain: true }),
                        surcharge_id: this.generateId('SUR'),
                        tariff_id: newTariffId,
                        created_at: undefined, updated_at: undefined
                    } as any, { transaction })
                ));
            }

            await transaction.commit();
            return { new_tariff_id: newTariffId };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async simulate(dto: any) {
        try {
            // Find matching tariff
            const tariff = await this.findMatchingTariff(dto);

            if (!tariff) {
                throw new BadRequestException('No tariff found for the given parameters');
            }

            // Calculate base price based on pricing model
            let basePrice = 0;
            let weightCharge = 0;
            let volumeCharge = 0;
            let distanceCharge = 0;
            let dailyRentalCharge = 0;

            switch (tariff.getDataValue('pricing_model')) {
                case 'WEIGHT_BASED':
                    const calculatedWeight = this.calculateChargeableWeight(dto.weight_kg, dto.volume_m3);
                    const result = this.calculateWeightBasedPrice(tariff, calculatedWeight);
                    basePrice = result.price;
                    weightCharge = result.price;
                    break;

                case 'ROUTE_BASED':
                    basePrice = this.calculateRouteBasedPrice(tariff, dto.origin, dto.destination, dto.item_type);
                    break;

                case 'DISTANCE_BASED':
                    const distResult = this.calculateDistanceBasedPrice(tariff, dto.distance_km, dto.item_type);
                    basePrice = distResult.totalPrice;
                    distanceCharge = distResult.distanceCharge;
                    break;

                case 'DAILY_BASED':
                    dailyRentalCharge = this.calculateDailyBasedPrice(tariff, dto.vehicle_type, dto.rental_days);
                    basePrice = dailyRentalCharge;
                    break;
            }

            // Apply minimum charge
            basePrice = Math.max(basePrice, Number(tariff.getDataValue('min_charge')));

            // Calculate additional charges
            const fragileCharge = dto.is_fragile ? 25000 : 0;
            const insuranceCharge = dto.insurance_value ? Number(dto.insurance_value) * 0.01 : 0;

            // Calculate surcharges
            let surchargeTotal = 0;
            if (tariff.getDataValue('surcharges') && tariff.getDataValue('surcharges').length > 0) {
                surchargeTotal = this.calculateSurcharges(tariff.getDataValue('surcharges'), basePrice);
            }

            // Subtotal
            const subtotal = basePrice + fragileCharge + insuranceCharge + surchargeTotal;

            // Apply discount (if promo code provided)
            const discount = dto.promo_code ? subtotal * 0.1 : 0;

            // Calculate tax (PPN 11%)
            const afterDiscount = subtotal - discount;
            const tax = afterDiscount * 0.11;

            // Final price
            const finalPrice = afterDiscount + tax;

            return {
                tariff_id: tariff.getDataValue('tariff_id'),
                tariff_name: tariff.getDataValue('tariff_name'),
                pricing_model: tariff.getDataValue('pricing_model'),
                breakdown: {
                    base_price: Math.round(basePrice),
                    weight_charge: Math.round(weightCharge),
                    volume_charge: Math.round(volumeCharge),
                    distance_charge: Math.round(distanceCharge),
                    daily_rental_charge: Math.round(dailyRentalCharge),
                    fragile_charge: Math.round(fragileCharge),
                    insurance_charge: Math.round(insuranceCharge),
                    surcharge_total: Math.round(surchargeTotal),
                    subtotal: Math.round(subtotal),
                    discount: Math.round(discount),
                    tax: Math.round(tax),
                    final_price: Math.round(finalPrice),
                },
                metadata: {
                    currency: tariff.getDataValue('currency'),
                    effective_date: dto.effective_date,
                    calculated_at: new Date().toISOString(),
                    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
            };
        } catch (error) {
            this.logger.error('Simulation error:', error);
            throw error;
        }
    }

    private async findMatchingTariff(dto: any) {
        const andConditions: any[] = [
            { service_type: dto.service_type },
            { sub_service: dto.sub_service },
            { is_active: true },
            // effective_end check
            {
                [Op.or]: [
                    { effective_end: { [Op.gte]: dto.effective_date } },
                    { effective_end: null }
                ]
            }
        ];

        if (dto.origin) {
            const normOrigin = String(dto.origin).trim().toLowerCase();
            andConditions.push({
                [Op.or]: [
                    this.sequelizeWhereLower('origin_zone', normOrigin),
                    { origin_zone: null }
                ]
            });
        }

        if (dto.destination) {
            const normDestination = String(dto.destination).trim().toLowerCase();
            andConditions.push({
                [Op.or]: [
                    this.sequelizeWhereLower('destination_zone', normDestination),
                    { destination_zone: null }
                ]
            });
        }

        if (dto.customer_id) {
            andConditions.push({
                [Op.or]: [
                    { customer_id: dto.customer_id },
                    { customer_id: null }
                ]
            });
        }

        const where = { [Op.and]: andConditions };

        const tariff = await this.masterTarifModel.findOne({
            where,
            include: [
                { model: this.tariffWeightTierModel, as: 'weightTiers' },
                { model: this.tariffRoutePriceModel, as: 'routePrices' },
                { model: this.tariffDistanceModel, as: 'distanceConfigs' },
                { model: this.tariffVehicleDailyModel, as: 'dailyRates' },
                { model: this.tariffSurchargeModel, as: 'surcharges' }
            ],
            order: [
                ['customer_id', 'DESC'],
                ['effective_start', 'DESC']
            ]
        });

        return tariff;
    }

    private calculateChargeableWeight(actualWeight: number, volumeM3?: number): number {
        if (!volumeM3) return actualWeight;
        const volumetricWeight = volumeM3 * 167;
        return Math.max(actualWeight, volumetricWeight);
    }

    // helper to build Sequelize where clause comparing LOWER(TRIM(column)) = value
    private sequelizeWhereLower(columnName: string, value: string) {
        return Sequelize.where(fn('LOWER', fn('TRIM', col(columnName))), value);
    }

    private calculateWeightBasedPrice(tariff: any, weight: number): { price: number } {
        const weightTiers = tariff.getDataValue ? tariff.getDataValue('weightTiers') : tariff.weightTiers;
        if (!weightTiers || weightTiers.length === 0) {
            throw new BadRequestException('No weight tiers configured for this tariff');
        }

        const tier = weightTiers.find((t: any) =>
            weight >= Number(t.getDataValue('min_weight_kg')) && weight <= Number(t.getDataValue('max_weight_kg'))
        );

        if (!tier) {
            throw new BadRequestException(`No weight tier found for ${weight} kg`);
        }

        const price = weight * Number(tier.getDataValue('rate_per_kg'));
        return { price };
    }

    private calculateRouteBasedPrice(tariff: any, origin: string, destination: string, itemType?: string): number {
        const routePrices = tariff.getDataValue ? tariff.getDataValue('routePrices') : tariff.routePrices;
        if (!routePrices || routePrices.length === 0) {
            throw new BadRequestException('No route prices configured for this tariff');
        }

        const norm = (v: any) => String(v ?? '').trim().toLowerCase();
        const route = routePrices.find((r: any) => {
            const getVal = (obj: any, key: string) => (obj && typeof obj.getDataValue === 'function' ? obj.getDataValue(key) : obj?.[key]);
            return norm(getVal(r, 'origin_city')) === norm(origin) &&
                norm(getVal(r, 'destination_city')) === norm(destination) &&
                (!itemType || norm(getVal(r, 'item_type')) === norm(itemType) || !getVal(r, 'item_type'));
        });

        if (!route) {
            throw new BadRequestException(`No route price found for ${origin} to ${destination}`);
        }

        const getVal = (obj: any, key: string) => (obj && typeof obj.getDataValue === 'function' ? obj.getDataValue(key) : obj?.[key]);
        return Number(getVal(route, 'price'));
    }

    private calculateDistanceBasedPrice(tariff: any, distanceKm: number, itemType?: string): { totalPrice: number; distanceCharge: number } {
        const getVal = (obj: any, key: string) => (obj && typeof obj.getDataValue === 'function' ? obj.getDataValue(key) : obj?.[key]);
        const distanceConfigs = getVal(tariff, 'distanceConfigs');
        if (!distanceConfigs || distanceConfigs.length === 0) {
            throw new BadRequestException('No distance configuration for this tariff');
        }

        const config = distanceConfigs.find((d: any) => {
            const minKm = getVal(d, 'min_km');
            const maxKm = getVal(d, 'max_km');
            const meetsMinCondition = !minKm || distanceKm >= Number(minKm);
            const meetsMaxCondition = !maxKm || distanceKm <= Number(maxKm);
            const meetsItemType = !itemType || getVal(d, 'item_type') === itemType || !getVal(d, 'item_type');

            return meetsItemType && meetsMinCondition && meetsMaxCondition;
        });

        if (!config) {
            throw new BadRequestException(`No distance configuration found for ${distanceKm} km`);
        }

        const basePrice = Number(getVal(config, 'base_price'));
        const distanceCharge = distanceKm * Number(getVal(config, 'rate_per_km'));
        const totalPrice = basePrice + distanceCharge;

        return { totalPrice, distanceCharge };
    }

    private calculateDailyBasedPrice(tariff: any, vehicleType: string, rentalDays: number): number {
        const getVal = (obj: any, key: string) => (obj && typeof obj.getDataValue === 'function' ? obj.getDataValue(key) : obj?.[key]);
        const dailyRates = getVal(tariff, 'dailyRates');
        if (!dailyRates || dailyRates.length === 0) {
            throw new BadRequestException('No daily rates configured for this tariff');
        }

        const rate = dailyRates.find((r: any) => getVal(r, 'vehicle_type') === vehicleType);

        if (!rate) {
            throw new BadRequestException(`No daily rate found for vehicle type: ${vehicleType}`);
        }

        return rentalDays * Number(getVal(rate, 'daily_rate'));
    }

    private calculateSurcharges(surcharges: any[], baseAmount: number): number {
        const getVal = (obj: any, key: string) => (obj && typeof obj.getDataValue === 'function' ? obj.getDataValue(key) : obj?.[key]);
        let total = 0;

        for (const surcharge of surcharges) {
            if (getVal(surcharge, 'calculation') === 'FIXED') {
                total += Number(getVal(surcharge, 'value'));
            } else if (getVal(surcharge, 'calculation') === 'PERCENTAGE') {
                total += baseAmount * (Number(getVal(surcharge, 'value')) / 100);
            }
        }

        return total;
    }
}

