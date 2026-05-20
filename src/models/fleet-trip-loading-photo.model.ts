import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { FleetTrip } from './fleet-trip.model';
import { FileLog } from './file-log.model';

@Table({
  tableName: 'fleet_trip_loading_photos',
  timestamps: false,
})
export class FleetTripLoadingPhoto extends Model<FleetTripLoadingPhoto> {
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

  @ForeignKey(() => FileLog)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare file_log_id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare created_at: Date;

  @BelongsTo(() => FleetTrip, { foreignKey: 'fleet_trip_id', as: 'fleetTrip' })
  fleetTrip: FleetTrip;

  @BelongsTo(() => FileLog, { foreignKey: 'file_log_id', as: 'fileLog' })
  fileLog: FileLog;
}
