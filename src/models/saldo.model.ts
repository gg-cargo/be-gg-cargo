import { Column, DataType, Model, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model';

@Table({
    tableName: 'saldo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Saldo extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.BIGINT.UNSIGNED,
        allowNull: false,
    })
    user_id: number;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
    })
    kode_referral: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    pin: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    saldo: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    saldo_dibekukan: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at: Date;

    // Relations
    @BelongsTo(() => User, { foreignKey: 'user_id', targetKey: 'id' })
    user: User;
} 