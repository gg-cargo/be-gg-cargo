import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { CustomerCompany } from './customer-company.model';
import { FileLog } from './file-log.model';
import { User } from './user.model';

@Table({
    tableName: 'customer_company_documents',
    timestamps: false,
})
export class CustomerCompanyDocument extends Model<CustomerCompanyDocument> {
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    })
    declare id: number;

    @ForeignKey(() => CustomerCompany)
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: false,
    })
    company_id: number;

    @Column({
        type: DataType.STRING(30),
        allowNull: false,
    })
    document_type: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    document_number: string;

    @ForeignKey(() => FileLog)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    file_log_id: number;

    @Column({
        type: DataType.STRING(30),
        allowNull: false,
        defaultValue: 'uploaded',
    })
    status: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: true,
    })
    verified_by: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    verified_at: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    rejection_reason: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    expired_at: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    metadata: string;

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

    @BelongsTo(() => CustomerCompany, { foreignKey: 'company_id', targetKey: 'id', as: 'company' })
    company: CustomerCompany;

    @BelongsTo(() => FileLog, { foreignKey: 'file_log_id', targetKey: 'id', as: 'file' })
    file: FileLog;

    @BelongsTo(() => User, { foreignKey: 'verified_by', targetKey: 'id', as: 'verifiedByUser' })
    verifiedByUser: User;
}
