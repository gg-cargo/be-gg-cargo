import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { CustomerCompany } from './customer-company.model';

@Table({
    tableName: 'customer_company_addresses',
    timestamps: false,
})
export class CustomerCompanyAddress extends Model<CustomerCompanyAddress> {
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
        type: DataType.STRING(100),
        allowNull: false,
        defaultValue: 'Kantor Pusat',
    })
    label: string;

    @Column({
        type: DataType.STRING(150),
        allowNull: true,
    })
    contact_name: string;

    @Column({
        type: DataType.STRING(30),
        allowNull: true,
    })
    contact_phone: string;

    @Column({
        type: DataType.STRING(150),
        allowNull: true,
    })
    contact_email: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    address: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    province: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    city: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    district: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    subdistrict: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
    })
    postal_code: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    location_text: string;

    @Column({
        type: DataType.DECIMAL(10, 7),
        allowNull: true,
    })
    lat: number;

    @Column({
        type: DataType.DECIMAL(10, 7),
        allowNull: true,
    })
    lng: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 1,
    })
    is_primary: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0,
    })
    is_billing: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0,
    })
    is_pickup: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0,
    })
    is_return: number;

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
}
