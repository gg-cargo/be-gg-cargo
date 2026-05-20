import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { FleetTrip } from './fleet-trip.model';

@Table({
  tableName: 'fleet_trip_waypoints',
  timestamps: false,
})
export class FleetTripWaypoint extends Model<FleetTripWaypoint> {
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
  declare sequence: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare label: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare lng: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare address: string | null;

  @BelongsTo(() => FleetTrip, { foreignKey: 'fleet_trip_id', as: 'fleetTrip' })
  fleetTrip: FleetTrip;
}
