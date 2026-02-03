import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Departure } from '../models/departure.model';
import { TruckList } from '../models/truck-list.model';
import { User } from '../models/user.model';
import { MasterRoute } from '../models/master-route.model';
import { LogGps } from '../models/log-gps.model';
import { Hub } from '../models/hub.model';

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
    @InjectModel(Hub)
    private hubModel: typeof Hub,
  ) { }

  async findAll() {
    const deps = await this.departureModel.findAll({ order: [['scheduled_at', 'DESC']] , raw: true});
    if (!deps || deps.length === 0) return deps;

    const driverIds = Array.from(new Set(deps.map((d: any) => d.driver_id).filter(Boolean)));
    const hubIds = Array.from(new Set(deps.flatMap((d: any) => [d.current_hub, d.next_hub]).filter(Boolean)));

    const [drivers, hubs] = await Promise.all([
      driverIds.length ? this.userModel.findAll({ where: { id: driverIds }, attributes: ['id', 'name'], raw: true }) : Promise.resolve([]),
      hubIds.length ? this.hubModel.findAll({ where: { id: hubIds }, attributes: ['id', 'nama'], raw: true }) : Promise.resolve([]),
    ]);

    const driverMap = new Map((drivers as any[]).map(u => [u.id, u.name]));
    const hubMap = new Map((hubs as any[]).map(h => [h.id, h.nama]));

    return deps.map((d: any) => ({
      ...d,
      driver_name: d.driver_id ? driverMap.get(d.driver_id) || null : null,
      current_hub_name: d.current_hub ? hubMap.get(d.current_hub) || null : null,
      next_hub_name: d.next_hub ? hubMap.get(d.next_hub) || null : null,
    }));
  }

  async create(payload: any) {
    const created = await this.departureModel.create({
      truck_id: payload.truck_id || null,
      driver_id: payload.driver_id || null,
      scheduled_at: payload.scheduled_at || null,
      assigned_route_id: payload.assigned_route_id || null,
      current_hub: payload.current_hub || null,
      next_hub: payload.next_hub || null,
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
    const driver = d.driver_id ? await this.userModel.findByPk(d.driver_id, { attributes: ['id', 'name'], raw: true }) : null;
    const currentHub = d.current_hub ? await this.hubModel.findByPk(d.current_hub, { attributes: ['id', 'nama'], raw: true }) : null;
    const nextHub = d.next_hub ? await this.hubModel.findByPk(d.next_hub, { attributes: ['id', 'nama'], raw: true }) : null;

    return {
      departure: d,
      route,
      lastPos,
      driver_name: driver ? driver.name : null,
      current_hub_name: currentHub ? currentHub.nama : null,
      next_hub_name: nextHub ? nextHub.nama : null,
    };
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

