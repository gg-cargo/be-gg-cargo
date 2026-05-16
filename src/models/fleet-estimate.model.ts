import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { FileLog } from './file-log.model';
import { Departure } from './departure.model';

export type FleetEstimateTripType = 'one_way' | 'two_way';
export type FleetEstimateRoadType = 'non_tol' | 'tol' | 'manual';
export type FleetEstimateApprovalStatus = 'pending' | 'approved' | 'rejected';

@Table({
  tableName: 'fleet_estimates',
  timestamps: false,
})
export class FleetEstimate extends Model<FleetEstimate> {
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  kota_asal: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  kota_tujuan: string;

  @Column({
    type: DataType.ENUM('one_way', 'two_way'),
    allowNull: false,
    defaultValue: 'one_way',
  })
  trip_type: FleetEstimateTripType;

  @Column({
    type: DataType.ENUM('non_tol', 'tol', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
  })
  road_type: FleetEstimateRoadType;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  distance_km: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  distance_km_effective: number;

  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  vehicle_type: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: true,
  })
  driver_1_user_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: true,
  })
  driver_2_user_id: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  driver_1_wage: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: true,
  })
  driver_2_wage: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  fuel_estimate: number;

  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  grand_total_operational: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  driver_1_account_no: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  driver_2_account_no: string;

  @ForeignKey(() => FileLog)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  loading_photo_file_log_id: number;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  })
  approval_status: FleetEstimateApprovalStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: true,
  })
  approved_by_user_id: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approved_at: Date;

  @ForeignKey(() => Departure)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  departure_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    allowNull: true,
  })
  created_by_user_id: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at: Date;

  @BelongsTo(() => User, { foreignKey: 'driver_1_user_id', targetKey: 'id', as: 'driver1' })
  driver1: User;

  @BelongsTo(() => User, { foreignKey: 'driver_2_user_id', targetKey: 'id', as: 'driver2' })
  driver2: User;

  @BelongsTo(() => User, { foreignKey: 'approved_by_user_id', targetKey: 'id', as: 'approvedByUser' })
  approvedByUser: User;

  @BelongsTo(() => User, { foreignKey: 'created_by_user_id', targetKey: 'id', as: 'createdByUser' })
  createdByUser: User;

  @BelongsTo(() => FileLog, { foreignKey: 'loading_photo_file_log_id', targetKey: 'id', as: 'loadingPhoto' })
  loadingPhoto: FileLog;

  @BelongsTo(() => Departure, { foreignKey: 'departure_id', targetKey: 'id', as: 'departure' })
  departure: Departure;
}
