import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RouteGate } from '../models/route-gate.model';
import { MasterRoute } from '../models/master-route.model';
import { MasterRouteGate } from '../models/master-route-gate.model';

@Injectable()
export class RouteGatesService {
  constructor(
    @InjectModel(RouteGate)
    private routeGateModel: typeof RouteGate,
    @InjectModel(MasterRoute)
    private masterRouteModel: typeof MasterRoute,
    @InjectModel(MasterRouteGate)
    private masterRouteGateModel: typeof MasterRouteGate,
  ) {}

  async dataset(bbox?: string) {
    // bbox format: minLng,minLat,maxLng,maxLat
    if (!bbox) {
      return this.routeGateModel.findAll({ limit: 50000 });
    }
    const parts = bbox.split(',').map(Number);
    if (parts.length !== 4) throw new BadRequestException('bbox invalid');
    const [minLng, minLat, maxLng, maxLat] = parts;
    return this.routeGateModel.findAll({
      where: {
        lng: { [Op.between]: [minLng, maxLng] },
        lat: { [Op.between]: [minLat, maxLat] },
      },
      limit: 50000,
    });
  }

  async addGateToRoute(routeId: number, payload: any) {
    const route = await this.masterRouteModel.findByPk(routeId);
    if (!route) throw new NotFoundException('Master route not found');

    // Must link existing route gate by external_id or route_gate_id; do not create dataset entries here
    let gate: any = null;
    if (payload.external_id) {
      gate = await this.routeGateModel.findOne({ where: { external_id: payload.external_id } });
    } else if (payload.route_gate_id) {
      gate = await this.routeGateModel.findByPk(payload.route_gate_id);
    }

    if (!gate) {
      throw new BadRequestException('Provide existing gate via external_id or route_gate_id. Creating new dataset entries here is not allowed.');
    }

    // create assignment in join table if not exists
    const existing = await this.masterRouteGateModel.findOne({
      where: { master_route_id: routeId, route_gate_id: gate.id },
    });
    if (existing) {
      // update sequence/toll override if provided
      if (typeof payload.sequence_index === 'number') existing.sequence_index = payload.sequence_index;
      if (typeof payload.toll_fee === 'number') existing.toll_fee_override = payload.toll_fee;
      await existing.save();
      return existing;
    }

    const created = await this.masterRouteGateModel.create({
      master_route_id: routeId,
      route_gate_id: gate.id,
      sequence_index: typeof payload.sequence_index === 'number' ? payload.sequence_index : null,
      toll_fee_override: typeof payload.toll_fee === 'number' ? payload.toll_fee : null,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    return created;
  }

  async updateGate(routeId: number, gateId: number, payload: any) {
    // update assignment record
    const assign = await this.masterRouteGateModel.findOne({ where: { master_route_id: routeId, route_gate_id: gateId } });
    if (!assign) throw new NotFoundException('Gate assignment not found for this route');
    if (typeof payload.toll_fee !== 'undefined') assign.toll_fee_override = payload.toll_fee;
    if (typeof payload.sequence_index !== 'undefined') assign.sequence_index = payload.sequence_index;
    await assign.save();
    return assign;
  }

  async removeGateFromRoute(routeId: number, gateId: number) {
    const assign = await this.masterRouteGateModel.findOne({ where: { master_route_id: routeId, route_gate_id: gateId } });
    if (!assign) throw new NotFoundException('Gate assignment not found for this route');
    await assign.destroy();
    return { success: true };
  }
}

