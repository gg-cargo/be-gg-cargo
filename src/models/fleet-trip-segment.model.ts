import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { FleetTrip } from './fleet-trip.model';

export type FleetTripSegmentRoadType = 'tol' | 'non_tol';

@Table({
  tableName: 'fleet_trip_segments',
  timestamps: false,
})
export class FleetTripSegment extends Model<FleetTripSegment> {
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => FleetTrip)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false })
  declare fleet_trip_id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare segment_no: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare titik_asal: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare titik_tujuan: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare titik_asal_lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare titik_asal_lng: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare titik_tujuan_lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare titik_tujuan_lng: number;

  @Column({
    type: DataType.ENUM('tol', 'non_tol'),
    allowNull: false,
  })
  declare road_type: FleetTripSegmentRoadType;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare distance_km: number;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare route_variant: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare route_jarak_km: number | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare route_estimasi_waktu: string | null;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare route_biaya_tol_idr: number | null;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare estimate_bbm_total: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare estimate_fuel_type: string | null;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare estimate_toll_total: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare estimate_distance_km_effective: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare estimate_grand_total_operational: number;

  @BelongsTo(() => FleetTrip, { foreignKey: 'fleet_trip_id', as: 'fleetTrip' })
  fleetTrip: FleetTrip;
}
