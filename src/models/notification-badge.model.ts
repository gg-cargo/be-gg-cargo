import { Column, DataType, Model, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model';

@Table({
    tableName: 'notification_badges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class NotificationBadge extends Model {
    @Column({
        type: DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    user_id: number | null;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
    })
    menu_name: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    item_id: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    item_type: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    hub_id: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0,
    })
    is_read: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    updated_at: Date;

    // Relations
    @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
    user: User;
}
