import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { MasterRoute } from './master-route.model';
import { RouteGate } from './route-gate.model';

@Table({
  tableName: 'master_route_gates',
  timestamps: false,
})
export class MasterRouteGate extends Model<MasterRouteGate> {
  @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => MasterRoute)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare master_route_id: number;

  @ForeignKey(() => RouteGate)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare route_gate_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare sequence_index: number | null;

  @Column({ type: DataType.BIGINT, allowNull: true })
  declare toll_fee_override: number | null;

  @BelongsTo(() => MasterRoute)
  masterRoute: MasterRoute;

  @BelongsTo(() => RouteGate)
  routeGate: RouteGate;
}

