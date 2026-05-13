import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { CustomerCompany } from './customer-company.model';
import { User } from './user.model';

@Table({
    tableName: 'customer_company_members',
    timestamps: false,
})
export class CustomerCompanyMember extends Model<CustomerCompanyMember> {
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

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: false,
    })
    user_id: number;

    @Column({
        type: DataType.STRING(30),
        allowNull: false,
        defaultValue: 'owner',
    })
    role: string;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0,
    })
    is_primary_pic: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 1,
    })
    is_active: number;

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

    @BelongsTo(() => User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' })
    user: User;
}
