import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'api_usage_log',
  timestamps: false,
})
export class ApiUsageLog extends Model<ApiUsageLog> {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  service: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  date: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  hit_count: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  updated_at: Date | null;
}
