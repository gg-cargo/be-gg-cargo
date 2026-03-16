import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderHistory } from '../models/order-history.model';
import { Vendor } from '../models/vendor.model';
import {
  FleetShipmentsQueryDto,
  FleetShipmentsResponseDto,
  FleetShipmentItemDto,
} from './dto/fleet-shipments.dto';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(OrderPickupDriver) private readonly orderPickupDriverModel: typeof OrderPickupDriver,
    @InjectModel(OrderHistory) private readonly orderHistoryModel: typeof OrderHistory,
    @InjectModel(Vendor) private readonly vendorModel: typeof Vendor,
  ) {}

  /**
   * Core API untuk dashboard Fleet: daftar shipments / resi.
   */
  async getShipments(query: FleetShipmentsQueryDto): Promise<FleetShipmentsResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const offset = (page - 1) * limit;

    // Mapping status frontend -> status di tabel orders
    let statusFilterSql = '';
    const replacements: Record<string, any> = {
      limit,
      offset,
    };

    if (query.status) {
      const status = String(query.status).toLowerCase();
      switch (status) {
        case 'pickup':
          statusFilterSql = 'AND (o.status_pickup IS NOT NULL)';
          break;
        case 'transit':
          statusFilterSql = "AND o.status = 'In Transit'";
          break;
        case 'out_for_delivery':
          statusFilterSql = "AND o.status = 'Out for Delivery'";
          break;
        case 'delivered':
          statusFilterSql = "AND o.status = 'Delivered'";
          break;
        default:
          // fallback: filter langsung ke kolom status
          statusFilterSql = 'AND o.status = :rawStatus';
          replacements.rawStatus = query.status;
      }
    }

    // Mapping service_id -> nama layanan
    let serviceFilterSql = '';
    if (query.service_id != null) {
      const mapServiceIdToName: Record<number, string> = {
        1: 'Kirim Hemat',
        2: 'Kirim Motor',
        3: 'Reguler',
      };
      const serviceName = mapServiceIdToName[query.service_id] ?? null;
      if (serviceName) {
        serviceFilterSql = 'AND o.layanan = :serviceName';
        replacements.serviceName = serviceName;
      }
    }

    // Filter vendor
    let vendorFilterSql = '';
    if (query.vendor_id != null) {
      vendorFilterSql = 'AND o.vendor_id = :vendorId';
      replacements.vendorId = query.vendor_id;
    }

    // Search by resi
    let searchFilterSql = '';
    if (query.search) {
      searchFilterSql = 'AND o.no_tracking LIKE :search';
      replacements.search = `%${query.search}%`;
    }

    // Base SQL: agregasi order + pickup_date + latest history
    const baseSelect = `
      SELECT
        o.id,
        o.no_tracking AS resi,
        o.layanan AS service_name,
        o.vendor_id,
        v.nama_vendor AS vendor_name,
        o.hub_source_id,
        hs.nama AS hub_source_name,
        o.hub_dest_id,
        hd.nama AS hub_dest_name,
        o.current_hub,
        hc.nama AS current_hub_name,
        MIN(op.assign_date) AS pickup_date,
        MAX(oh.created_at) AS last_update,
        MAX(oh.status) AS latest_status,
        -- transit_days dihitung dari pickup_date (lihat fleet_shipments_api.md)
        DATEDIFF(NOW(), MIN(op.assign_date)) AS transit_days_raw,
        CASE
          WHEN o.layanan = 'Kirim Hemat' THEN 5
          WHEN o.layanan = 'Reguler' THEN 3
          WHEN o.layanan = 'Express' THEN 1
          ELSE 5
        END AS sla_days
      FROM orders o
      LEFT JOIN vendors v ON v.id = o.vendor_id
      LEFT JOIN hubs hs ON hs.id = o.hub_source_id
      LEFT JOIN hubs hd ON hd.id = o.hub_dest_id
      LEFT JOIN hubs hc ON hc.id = o.current_hub
      LEFT JOIN order_pickup_drivers op ON op.order_id = o.id
      LEFT JOIN order_histories oh ON oh.order_id = o.id
      WHERE 1 = 1
        ${statusFilterSql}
        ${serviceFilterSql}
        ${vendorFilterSql}
        ${searchFilterSql}
      GROUP BY
        o.id,
        o.no_tracking,
        o.layanan,
        o.vendor_id,
        v.nama_vendor,
        o.hub_source_id,
        hs.nama,
        o.hub_dest_id,
        hd.nama,
        o.current_hub,
        hc.nama
    `;

    // Tambah HAVING untuk delay_only jika perlu
    let havingClause = '';
    if (query.delay_only) {
      havingClause = `
        HAVING
          pickup_date IS NOT NULL
          AND DATEDIFF(NOW(), pickup_date) > sla_days
      `;
    }

    const finalSql = `
      ${baseSelect}
      ${havingClause}
      ORDER BY o.id DESC
      LIMIT :limit OFFSET :offset
    `;

    const sequelize = this.orderModel.sequelize as Sequelize;

    try {
      const rows: any[] = await sequelize.query(finalSql, {
        type: QueryTypes.SELECT,
        replacements,
      });

      // Hitung total sederhana (tanpa pagination) untuk saat ini.
      // Jika delay_only digunakan, total diset ke jumlah baris setelah filter.
      let total = 0;
      if (query.delay_only) {
        total = rows.length;
      } else {
        const countSql = `
          SELECT COUNT(DISTINCT o.id) AS total
          FROM orders o
          LEFT JOIN vendors v ON v.id = o.vendor_id
          LEFT JOIN order_pickup_drivers op ON op.order_id = o.id
          LEFT JOIN order_histories oh ON oh.order_id = o.id
          WHERE 1 = 1
            ${statusFilterSql}
            ${serviceFilterSql}
            ${vendorFilterSql}
            ${searchFilterSql}
        `;
        const countRows: any[] = await sequelize.query(countSql, {
          type: QueryTypes.SELECT,
          replacements,
        });
        total = Number(countRows[0]?.total || 0);
      }

      const data: FleetShipmentItemDto[] = rows.map((row) => {
        const pickupDate: Date | null = row.pickup_date ? new Date(row.pickup_date) : null;
        const lastUpdate: Date | null = row.last_update ? new Date(row.last_update) : null;
        const transitDaysRaw: number =
          row.transit_days_raw != null ? Number(row.transit_days_raw) : 0;
        const slaDays: number | null =
          row.sla_days != null ? Number(row.sla_days) : null;

        const transitDays =
          pickupDate && typeof transitDaysRaw === 'number' && !Number.isNaN(transitDaysRaw)
            ? Math.max(transitDaysRaw, 0)
            : 0;

        const effectiveSlaDays = slaDays ?? 0;
        const slaStatus: 'ON_TIME' | 'DELAY' =
          effectiveSlaDays > 0 && transitDays > effectiveSlaDays ? 'DELAY' : 'ON_TIME';

        const serviceName: string = row.service_name || '-';
        const serviceIdFromName = this.mapServiceNameToId(serviceName);

        return {
          resi: row.resi,
          service: {
            id: serviceIdFromName,
            name: serviceName,
          },
          vendor: {
            id: row.vendor_id ?? null,
            name: row.vendor_name || (row.vendor_id ? '-' : 'Internal Fleet'),
          },
          hub_source_id: row.hub_source_id ?? null,
          hub_source_name: row.hub_source_name || null,
          hub_dest_id: row.hub_dest_id ?? null,
          hub_dest_name: row.hub_dest_name || null,
          current_hub_id: row.current_hub ?? null,
          current_hub_name: row.current_hub_name || null,
          pickup_date: pickupDate ? this.formatDateOnly(pickupDate) : null,
          transit_days: transitDays,
          latest_status: row.latest_status || null,
          sla_days: slaDays,
          sla_status: slaStatus,
          last_update: lastUpdate ? this.formatDateTime(lastUpdate) : null,
        };
      });

      return {
        page,
        limit,
        total,
        data,
      };
    } catch (error: any) {
      this.logger.error(`Error in getShipments: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapServiceNameToId(name: string): number | null {
    const normalized = (name || '').toLowerCase();
    if (normalized === 'kirim hemat') return 1;
    if (normalized === 'kirim motor') return 2;
    if (normalized === 'reguler' || normalized === 'regular') return 3;
    if (normalized === 'express') return 4;
    return null;
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

