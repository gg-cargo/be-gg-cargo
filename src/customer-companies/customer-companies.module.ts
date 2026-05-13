import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CustomerCompaniesController } from './customer-companies.controller';
import { CustomerCompaniesService } from './customer-companies.service';
import { CustomerCompany } from '../models/customer-company.model';
import { CustomerCompanyMember } from '../models/customer-company-member.model';
import { CustomerCompanyAddress } from '../models/customer-company-address.model';
import { CustomerCompanyDocument } from '../models/customer-company-document.model';
import { User } from '../models/user.model';
import { FileLog } from '../models/file-log.model';

@Module({
    imports: [
        SequelizeModule.forFeature([
            CustomerCompany,
            CustomerCompanyMember,
            CustomerCompanyAddress,
            CustomerCompanyDocument,
            User,
            FileLog,
        ]),
    ],
    controllers: [CustomerCompaniesController],
    providers: [CustomerCompaniesService],
    exports: [CustomerCompaniesService],
})
export class CustomerCompaniesModule { }
