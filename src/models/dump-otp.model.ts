import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'dump_otp',
  timestamps: false,
})
export class DumpOtp extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  otp: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
} 