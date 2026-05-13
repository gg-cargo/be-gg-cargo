import { BelongsTo, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { CustomerCompanyMember } from './customer-company-member.model';
import { CustomerCompanyAddress } from './customer-company-address.model';
import { CustomerCompanyDocument } from './customer-company-document.model';

@Table({
    tableName: 'customer_companies',
    timestamps: false,
})
export class CustomerCompany extends Model<CustomerCompany> {
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(30),
        allowNull: false,
    })
    company_code: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: false,
    })
    company_name: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    legal_name: string;

    @Column({
        type: DataType.STRING(150),
        allowNull: true,
    })
    company_email: string;

    @Column({
        type: DataType.STRING(30),
        allowNull: true,
    })
    company_phone: string;

    @Column({
        type: DataType.STRING(30),
        allowNull: false,
        defaultValue: 'b2b',
    })
    company_type: string;

    @Column({
        type: DataType.STRING(30),
        allowNull: false,
        defaultValue: 'draft',
    })
    status: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    payment_terms_days: number;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    })
    discount_rate: number;

    @Column({
        type: DataType.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
    })
    credit_limit: number;

    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: true,
    })
    referred_by_sales_id: number;

    @Column({
        type: DataType.STRING(25),
        allowNull: true,
    })
    referral_code_input: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    sales_linked_at: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    rejection_reason: string;

    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: true,
    })
    created_by: number;

    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: true,
    })
    updated_by: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    deleted_at: Date;

    @BelongsTo(() => User, { foreignKey: 'referred_by_sales_id', targetKey: 'id', as: 'salesReferrer' })
    salesReferrer: User;

    @BelongsTo(() => User, { foreignKey: 'created_by', targetKey: 'id', as: 'createdByUser' })
    createdByUser: User;

    @BelongsTo(() => User, { foreignKey: 'updated_by', targetKey: 'id', as: 'updatedByUser' })
    updatedByUser: User;

    @HasMany(() => CustomerCompanyMember, { foreignKey: 'company_id', sourceKey: 'id', as: 'members' })
    members: CustomerCompanyMember[];

    @HasMany(() => CustomerCompanyAddress, { foreignKey: 'company_id', sourceKey: 'id', as: 'addresses' })
    addresses: CustomerCompanyAddress[];

    @HasMany(() => CustomerCompanyDocument, { foreignKey: 'company_id', sourceKey: 'id', as: 'documents' })
    documents: CustomerCompanyDocument[];
}
