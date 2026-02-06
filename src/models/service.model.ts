import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { SubService } from './sub-service.model';

@Table({
    tableName: 'services',
    timestamps: true,
    underscored: true,
})
export class Service extends Model<Service> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare service_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    service_code: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    service_name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    description: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    is_international: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    is_active: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    sort_order: number;

    @HasMany(() => SubService)
    subServices: SubService[];
}
