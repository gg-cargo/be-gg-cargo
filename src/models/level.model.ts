import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'levels',
  timestamps: false,
})
export class Level extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  nama: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  level: number;
} 