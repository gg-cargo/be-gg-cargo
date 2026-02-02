import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Departure } from '../models/departure.model';
import { TruckList } from '../models/truck-list.model';
import { User } from '../models/user.model';
import { MasterRoute } from '../models/master-route.model';
import { LogGps } from '../models/log-gps.model';

@Injectable()
export class DeparturesService {
  constructor(
    @InjectModel(Departure)
    private departureModel: typeof Departure,
    @InjectModel(TruckList)
    private truckModel: typeof TruckList,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(MasterRoute)
    private routeModel: typeof MasterRoute,
    @InjectModel(LogGps)
    private logGpsModel: typeof LogGps,
  ) {}

  async findAll() {
    return this.departureModel.findAll({ order: [['scheduled_at', 'DESC']] });
  }

  async create(payload: any) {
    const created = await this.departureModel.create({
      truck_id: payload.truck_id || null,
      driver_id: payload.driver_id || null,
      scheduled_at: payload.scheduled_at || null,
      assigned_route_id: payload.assigned_route_id || null,
      est_fuel: payload.est_fuel || 0,
      est_driver1: payload.est_driver1 || 0,
      est_driver2: payload.est_driver2 || 0,
      other_costs: payload.other_costs || 0,
      toll_total: payload.toll_total || 0,
      grand_total: payload.grand_total || 0,
      status: 'pending',
    } as any);
    return created;
  }

  async findOne(id: number) {
    const d = await this.departureModel.findByPk(id);
    if (!d) throw new NotFoundException('Departure not found');
    const route = d.assigned_route_id ? await this.routeModel.findByPk(d.assigned_route_id) : null;
    // get latest gps by driver_id or truck_id (try driver_id)
    let lastPos: { lat: number; lng: number; at: Date } | null = null;
    if (d.driver_id) {
      const lg = await this.logGpsModel.findOne({ where: { user_id: String(d.driver_id) }, order: [['created_at', 'DESC']] });
      if (lg && lg.latlng) {
        const parts = lg.latlng.split(',').map(Number);
        if (parts.length >= 2) lastPos = { lat: parts[0], lng: parts[1], at: lg.created_at };
      }
    }
    return { departure: d, route, lastPos };
  }

  async update(id: number, payload: any) {
    const d = await this.departureModel.findByPk(id);
    if (!d) throw new NotFoundException('Departure not found');
    await d.update(payload as any);
    return d;
  }

  async start(id: number) {
    const d = await this.departureModel.findByPk(id);
    if (!d) throw new NotFoundException('Departure not found');
    d.status = 'departed';
    await d.save();
    return d;
  }

  async complete(id: number) {
    const d = await this.departureModel.findByPk(id);
    if (!d) throw new NotFoundException('Departure not found');
    d.status = 'completed';
    await d.save();
    return d;
  }
}

