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
import { Sequelize } from 'sequelize-typescript';
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
            const distanceId = this.generateId('DIST');
            await this.tariffDistanceModel.create({
                distance_id: distanceId,
                tariff_id: tariffId,
                base_price: dto.distance_config.base_price,
                rate_per_km: dto.distance_config.rate_per_km,
                max_km: dto.distance_config.max_km || null,
            } as any, { transaction });
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
}
