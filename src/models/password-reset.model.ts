import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'password_resets',
  timestamps: false,
})
export class PasswordReset extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  token: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at: Date;
} 