import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RouteGate } from '../models/route-gate.model';
import { MasterRoute } from '../models/master-route.model';

@Injectable()
export class RouteGatesService {
  constructor(
    @InjectModel(RouteGate)
    private routeGateModel: typeof RouteGate,
    @InjectModel(MasterRoute)
    private masterRouteModel: typeof MasterRoute,
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

    if (payload.external_id) {
      // find existing gate
      const gate = await this.routeGateModel.findOne({ where: { external_id: payload.external_id } });
      if (!gate) throw new NotFoundException('External gate not found');
      gate.master_route_id = routeId;
      if (typeof payload.sequence_index === 'number') gate.sequence_index = payload.sequence_index;
      await gate.save();
      return gate;
    }

    // create new gate
    const { name, lat, lng, type = 'tol', toll_fee = 0, sequence_index = null } = payload;
    if (!name || !lat || !lng) throw new BadRequestException('name, lat, lng required');
    const created = await this.routeGateModel.create({
      master_route_id: routeId,
      external_id: null,
      name,
      type,
      lat,
      lng,
      toll_fee: toll_fee || 0,
      sequence_index,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    return created;
  }

  async updateGate(routeId: number, gateId: number, payload: any) {
    const gate = await this.routeGateModel.findByPk(gateId);
    if (!gate) throw new NotFoundException('Gate not found');
    if (gate.master_route_id !== routeId) {
      // allow updating even if not linked? enforce link
      throw new BadRequestException('Gate not linked to this route');
    }
    if (typeof payload.toll_fee !== 'undefined') gate.toll_fee = payload.toll_fee;
    if (typeof payload.sequence_index !== 'undefined') gate.sequence_index = payload.sequence_index;
    await gate.save();
    return gate;
  }

  async removeGateFromRoute(routeId: number, gateId: number) {
    const gate = await this.routeGateModel.findByPk(gateId);
    if (!gate) throw new NotFoundException('Gate not found');
    if (gate.master_route_id !== routeId) {
      throw new BadRequestException('Gate not linked to this route');
    }
    // disassociate from route (do not delete)
    gate.master_route_id = null;
    gate.sequence_index = null;
    await gate.save();
    return { success: true };
  }
}

