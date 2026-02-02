import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './user.model';
import { RouteGate } from './route-gate.model';
import { RoutePolyline } from './route-polyline.model';

@Table({
  tableName: 'master_routes',
  timestamps: false,
})
export class MasterRoute extends Model<MasterRoute> {
  @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  route_code: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  origin_name: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  origin_lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  origin_lng: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  destination_name: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  destination_lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  destination_lng: number;

  @Column({ type: DataType.ENUM('one_way', 'round_trip', 'multi_drop'), allowNull: false, defaultValue: 'one_way' })
  route_type: string;

  @Column({ type: DataType.ENUM('tol', 'non_tol', 'campuran'), allowNull: false, defaultValue: 'tol' })
  road_constraint: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  service_zone: string;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  default_distance_km: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  default_duration_min: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  created_by: number;

  @HasMany(() => RouteGate)
  gates: RouteGate[];

  @HasMany(() => RoutePolyline)
  polylines: RoutePolyline[];
}

