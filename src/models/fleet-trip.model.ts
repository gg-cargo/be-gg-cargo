import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model';
import { FleetTripWaypoint } from './fleet-trip-waypoint.model';
import { FleetTripSegment } from './fleet-trip-segment.model';
import { FleetTripAssignment } from './fleet-trip-assignment.model';
import { FleetTripLoadingPhoto } from './fleet-trip-loading-photo.model';

export type FleetTripType = 'one_way' | 'two_way';
export type FleetTripRoadType = 'non_tol' | 'tol' | 'manual';
export type FleetTripStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type FleetTripApproveStatus = 'pending' | 'approved' | 'rejected';

@Table({
  tableName: 'fleet_trips',
  timestamps: false,
})
export class FleetTrip extends Model<FleetTrip> {
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  declare tracking_no: string;

  @Column({
    type: DataType.ENUM('one_way', 'two_way'),
    allowNull: false,
    defaultValue: 'one_way',
  })
  declare trip_type: FleetTripType;

  @Column({
    type: DataType.ENUM('non_tol', 'tol', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
  })
  declare road_type: FleetTripRoadType;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare kota_asal: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare kota_tujuan: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  declare vehicle_type: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare distance_km_total: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare estimasi_bbm_total: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare estimasi_tol_total: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare estimasi_waktu_tiba: string | null;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare estimasi_waktu_menit: number | null;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare supir_1_total: number;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare supir_2_total: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare supir_2_eligible: boolean;

  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare grand_total_operational: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare fuel_type: string | null;

  @Column({
    type: DataType.ENUM('draft', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft',
  })
  declare status: FleetTripStatus;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare approve_status: FleetTripApproveStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare approve_by_user_id: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare approve_at: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare created_by_user_id: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare created_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare updated_at: Date | null;

  @HasMany(() => FleetTripWaypoint, {
    foreignKey: 'fleet_trip_id',
    as: 'waypoints',
  })
  waypoints: FleetTripWaypoint[];

  @HasMany(() => FleetTripSegment, {
    foreignKey: 'fleet_trip_id',
    as: 'segments',
  })
  segments: FleetTripSegment[];

  @HasOne(() => FleetTripAssignment, {
    foreignKey: 'fleet_trip_id',
    as: 'assignment',
  })
  assignment: FleetTripAssignment;

  @HasMany(() => FleetTripLoadingPhoto, {
    foreignKey: 'fleet_trip_id',
    as: 'loadingPhotos',
  })
  loadingPhotos: FleetTripLoadingPhoto[];

  @BelongsTo(() => User, { foreignKey: 'created_by_user_id', as: 'createdByUser' })
  createdByUser: User;

  @BelongsTo(() => User, { foreignKey: 'approve_by_user_id', as: 'approveByUser' })
  approveByUser: User;
}
