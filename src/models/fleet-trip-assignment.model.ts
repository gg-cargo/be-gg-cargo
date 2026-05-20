import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { FleetTrip } from './fleet-trip.model';
import { User } from './user.model';
import { Vendor } from './vendor.model';

export type FleetTripAssigneeType = 'mitra' | 'vendor';

@Table({
  tableName: 'fleet_trip_assignments',
  timestamps: false,
})
export class FleetTripAssignment extends Model<FleetTripAssignment> {
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => FleetTrip)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: false, unique: true })
  declare fleet_trip_id: number;

  @Column({
    type: DataType.ENUM('mitra', 'vendor'),
    allowNull: false,
  })
  declare assignee_type: FleetTripAssigneeType;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare assigned_by_user_id: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare driver_1_user_id: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare driver_2_user_id: number | null;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  declare vendor_id: number | null;

  @BelongsTo(() => FleetTrip, { foreignKey: 'fleet_trip_id', as: 'fleetTrip' })
  fleetTrip: FleetTrip;

  @BelongsTo(() => User, { foreignKey: 'assigned_by_user_id', as: 'assignedByUser' })
  assignedByUser: User;

  @BelongsTo(() => User, { foreignKey: 'driver_1_user_id', as: 'driver1' })
  driver1: User;

  @BelongsTo(() => User, { foreignKey: 'driver_2_user_id', as: 'driver2' })
  driver2: User;

  @BelongsTo(() => Vendor, { foreignKey: 'vendor_id', as: 'vendor' })
  vendor: Vendor;
}
