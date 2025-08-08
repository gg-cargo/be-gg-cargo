import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bank } from '../models/bank.model';
import { GetInternalBanksDto } from './dto/get-internal-banks.dto';
import { InternalBankResponseDto } from './dto/internal-bank-response.dto';
import { Op } from 'sequelize';

@Injectable()
export class BanksService {
    constructor(
        @InjectModel(Bank)
        private readonly bankModel: typeof Bank,
    ) { }

    async getInternalBanks(query: GetInternalBanksDto): Promise<InternalBankResponseDto[]> {
        const { type, bank_name } = query;

        // Build where clause
        const whereClause: any = {};

        if (bank_name) {
            whereClause.bank_name = {
                [Op.like]: `%${bank_name}%`
            };
        }

        // Get all banks
        const banks = await this.bankModel.findAll({
            where: whereClause,
            raw: true,
        });

        // Transform and filter data
        const transformedBanks = banks.map(bank => {
            // Extract type from account_name
            const extractedType = this.extractTypeFromAccountName(bank.account_name);

            // Get linked entity name
            const linkedEntityName = this.getLinkedEntityName(extractedType);

            return {
                id: bank.id,
                bank_name: bank.bank_name,
                account_name: bank.account_name,
                no_account: bank.no_account,
                type: extractedType,
                linked_entity_name: linkedEntityName,
            };
        });

        // Filter by type if specified
        if (type) {
            return transformedBanks.filter(bank =>
                bank.type.toLowerCase() === type.toLowerCase()
            );
        }

        return transformedBanks;
    }

    private extractTypeFromAccountName(accountName: string): string {
        const accountNameLower = accountName.toLowerCase();

        if (accountNameLower.includes('pt')) return 'PT';
        if (accountNameLower.includes('sc')) return 'SC';
        if (accountNameLower.includes('hc')) return 'HC';
        if (accountNameLower.includes('kc')) return 'KC';

        // Default to PT if no type found
        return 'PT';
    }

    private getLinkedEntityName(type: string): string {
        switch (type.toUpperCase()) {
            case 'PT':
            case 'HC':
                return 'Kantor Pusat';
            case 'SC':
                return 'Service Center';
            case 'KC':
                return 'Kios Center';
            default:
                return 'Kantor Pusat';
        }
    }
} 