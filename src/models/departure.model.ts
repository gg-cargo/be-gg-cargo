import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TruckList } from './truck-list.model';
import { User } from './user.model';
import { MasterRoute } from './master-route.model';

@Table({
  tableName: 'departures',
  timestamps: false,
})
export class Departure extends Model<Departure> {
  @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => TruckList)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  truck_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT.UNSIGNED, allowNull: true })
  driver_id: number;

  @Column({ type: DataType.DATE, allowNull: true })
  scheduled_at: Date;

  @ForeignKey(() => MasterRoute)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  assigned_route_id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  current_hub: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  next_hub: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  est_fuel: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  est_driver1: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  est_driver2: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  other_costs: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  toll_total: number;

  @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: 0 })
  grand_total: number;

  @Column({ type: DataType.ENUM('pending', 'scheduled', 'departed', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' })
  status: string;

  @BelongsTo(() => TruckList)
  truck: TruckList;

  @BelongsTo(() => User)
  driver: User;

  @BelongsTo(() => MasterRoute)
  route: MasterRoute;
}

