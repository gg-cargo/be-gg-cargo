import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterRoute } from './master-route.model';

@Table({
  tableName: 'route_gates',
  timestamps: false,
})
export class RouteGate extends Model<RouteGate> {
  @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => MasterRoute)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare master_route_id: number | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare external_id: string | null;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.ENUM('tol', 'pelabuhan'), allowNull: false, defaultValue: 'tol' })
  type: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  lng: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  declare toll_fee: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare sequence_index: number | null;

  @BelongsTo(() => MasterRoute)
  masterRoute: MasterRoute;
}

