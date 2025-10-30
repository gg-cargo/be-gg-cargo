import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
@Table({
    tableName: 'users_emergency_contact',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class UsersEmergencyContact extends Model {
    @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
    declare id: number;
    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: false })
    user_id: number;
    @BelongsTo(() => User, 'user_id')
    user: User;
    @Column({ type: DataType.STRING(20), allowNull: false })
    nomor: string;
    @Column({ type: DataType.STRING(50), allowNull: true })
    keterangan: string;
    @Column({ type: DataType.DATE, allowNull: false })
    created_at: Date;
    @Column({ type: DataType.DATE, allowNull: false })
    updated_at: Date;
}
