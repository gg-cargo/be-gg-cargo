import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MasterRoute } from '../models/master-route.model';
import { RouteGate } from '../models/route-gate.model';
import { RoutePolyline } from '../models/route-polyline.model';
import { MasterRouteGate } from '../models/master-route-gate.model';
import { CreateMasterRouteDto } from './dto/create-master-route.dto';
import { UpdateMasterRouteDto } from './dto/update-master-route.dto';
import { Op } from 'sequelize';

@Injectable()
export class MasterRoutesService {
  private readonly logger = new Logger(MasterRoutesService.name);
  constructor(
    @InjectModel(MasterRoute)
    private masterRouteModel: typeof MasterRoute,
    @InjectModel(RouteGate)
    private routeGateModel: typeof RouteGate,
    @InjectModel(RoutePolyline)
    private routePolylineModel: typeof RoutePolyline,
    @InjectModel(MasterRouteGate)
    private masterRouteGateModel: typeof MasterRouteGate,
  ) {}

  async findAll(params: { page?: number; limit?: number; search?: string; road_constraint?: string }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 && params.limit <= 200 ? params.limit : 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where[Op.or] = [
        { route_code: { [Op.like]: `%${params.search}%` } },
        { origin_name: { [Op.like]: `%${params.search}%` } },
        { destination_name: { [Op.like]: `%${params.search}%` } },
      ];
    }
    if (params.road_constraint) {
      where.road_constraint = params.road_constraint;
    }

    const { rows, count } = await this.masterRouteModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      attributes: ['id', 'route_code', 'origin_name', 'destination_name', 'route_type', 'road_constraint', 'default_distance_km', 'default_duration_min'],
    });
    return { data: rows, total: count, page, limit };
  }

  async create(dto: CreateMasterRouteDto, createdBy?: number) {
    const nextCode = `RT-${Date.now().toString().slice(-6)}`;
    const created = await this.masterRouteModel.create({
      route_code: nextCode,
      origin_name: dto.origin_name,
      origin_lat: dto.origin_lat,
      origin_lng: dto.origin_lng,
      destination_name: dto.destination_name,
      destination_lat: dto.destination_lat,
      destination_lng: dto.destination_lng,
      route_type: dto.route_type || 'one_way',
      road_constraint: dto.road_constraint || 'tol',
      service_zone: dto.service_zone || null,
      created_by: createdBy || null,
    } as any);
    return created;
  }

  async findOne(id: number) {
    const route = await this.masterRouteModel.findByPk(id);
    if (!route) throw new NotFoundException('Master route not found');

    // load assigned gates via join table (ordered)
    const assignments = await this.masterRouteGateModel.findAll({
      where: { master_route_id: id },
      include: [{ model: this.routeGateModel }],
      order: [['sequence_index', 'ASC']],
    });
    const gates = assignments.map((a: any) => {
      const g = a.routeGate;
      return {
        id: g.id,
        external_id: g.external_id,
        name: g.name,
        type: g.type,
        lat: g.lat,
        lng: g.lng,
        toll_fee: a.toll_fee_override ?? g.toll_fee,
        sequence_index: a.sequence_index,
      };
    });

    const latestPolyline = await this.routePolylineModel.findOne({ where: { master_route_id: id }, order: [['created_at', 'DESC']] });
    return { route, gates, latestPolyline };
  }

  async update(id: number, dto: UpdateMasterRouteDto) {
    const route = await this.masterRouteModel.findByPk(id);
    if (!route) throw new NotFoundException('Master route not found');
    await route.update(dto as any);
    return route;
  }

  async remove(id: number) {
    const route = await this.masterRouteModel.findByPk(id);
    if (!route) throw new NotFoundException('Master route not found');
    await route.destroy();
    return { success: true };
  }
}

