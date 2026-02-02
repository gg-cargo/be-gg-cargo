import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterRoute } from './master-route.model';

@Table({
  tableName: 'route_polylines',
  timestamps: false,
})
export class RoutePolyline extends Model<RoutePolyline> {
  @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => MasterRoute)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  master_route_id: number;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  geometry: string;

  @Column({ type: DataType.DOUBLE, allowNull: true })
  distance_m: number;

  @Column({ type: DataType.DOUBLE, allowNull: true })
  duration_s: number;

  @BelongsTo(() => MasterRoute)
  route: MasterRoute;
}

