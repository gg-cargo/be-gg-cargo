import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderHistory } from '../models/order-history.model';
import { Vendor } from '../models/vendor.model';
import { Hub } from '../models/hub.model';
import {
  FleetShipmentsQueryDto,
  FleetShipmentsResponseDto,
  FleetShipmentItemDto,
} from './dto/fleet-shipments.dto';
import {
  FleetDashboardSummaryResponseDto,
  FleetDashboardHubSummaryDto,
  FleetDashboardTotalSummaryDto,
} from './dto/fleet-dashboard-summary.dto';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(OrderPickupDriver) private readonly orderPickupDriverModel: typeof OrderPickupDriver,
    @InjectModel(OrderHistory) private readonly orderHistoryModel: typeof OrderHistory,
    @InjectModel(Vendor) private readonly vendorModel: typeof Vendor,
    @InjectModel(Hub) private readonly hubModel: typeof Hub,
  ) { }

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

    // Filter langsung berdasarkan layanan (orders.layanan)
    let layananFilterSql = '';
    if (query.layanan) {
      layananFilterSql = 'AND o.layanan = :layanan';
      replacements.layanan = query.layanan;
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
        o.nama_pengirim AS customer,
        o.layanan AS layanan,
        (SELECT COALESCE(SUM(p.berat), 0) FROM order_pieces p WHERE p.order_id = o.id) AS berat,
        (SELECT COUNT(*) FROM order_pieces p WHERE p.order_id = o.id) AS koli,
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
        MAX(o.status) AS latest_status,
        o.reweight_status,
        -- transit_time dihitung dari pickup_date (dalam jam)
        TIMESTAMPDIFF(HOUR, MIN(op.assign_date), NOW()) AS transit_time_raw,
        MAX(ss.sla_hours) AS sla_days
      FROM orders o
      LEFT JOIN vendors v ON v.id = o.vendor_id
      LEFT JOIN hubs hs ON hs.id = o.hub_source_id
      LEFT JOIN hubs hd ON hd.id = o.hub_dest_id
      LEFT JOIN hubs hc ON hc.id = o.current_hub
      LEFT JOIN sub_services ss ON ss.sub_service_name = o.layanan
      LEFT JOIN order_pickup_drivers op ON op.order_id = o.id
      LEFT JOIN order_histories oh ON oh.order_id = o.id
      WHERE 1 = 1
        ${statusFilterSql}
        ${serviceFilterSql}
        ${layananFilterSql}
        ${vendorFilterSql}
        ${searchFilterSql}
      GROUP BY
        o.id,
        o.no_tracking,
        o.nama_pengirim,
        o.layanan,
        o.vendor_id,
        v.nama_vendor,
        o.hub_source_id,
        hs.nama,
        o.hub_dest_id,
        hd.nama,
        o.current_hub,
        hc.nama,
        o.reweight_status
    `;

    // Tambah HAVING untuk delay_only jika perlu
    let havingClause = '';
    if (query.delay_only) {
      havingClause = `
        HAVING
          pickup_date IS NOT NULL
          AND transit_time_raw > sla_days
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
            ${layananFilterSql}
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
        const transitTimeRaw: number =
          row.transit_time_raw != null ? Number(row.transit_time_raw) : 0;
        const slaDays: number | null =
          row.sla_days != null ? Number(row.sla_days) : null;

        const transitTime =
          pickupDate && typeof transitTimeRaw === 'number' && !Number.isNaN(transitTimeRaw)
            ? Math.max(transitTimeRaw, 0)
            : 0;

        const effectiveSlaDays = slaDays ?? 0;
        const slaStatus: 'ON_TIME' | 'DELAY' =
          effectiveSlaDays > 0 && transitTime > effectiveSlaDays ? 'DELAY' : 'ON_TIME';

        const serviceName: string = row.service_name || '-';
        const serviceIdFromName = this.mapServiceNameToId(serviceName);
        const reweightStatusNum = Number(row.reweight_status);

        return {
          order_id: row.id,
          resi: row.resi,
          customer: row.customer || null,
          layanan: row.layanan || null,
          berat: row.berat != null ? `${Number(row.berat).toFixed(1)} kg` : null,
          koli: row.koli != null ? Number(row.koli) : null,
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
          pickup_date: pickupDate ? this.formatDateTime(pickupDate) : null,
          transit_time: transitTime,
          latest_status: row.latest_status || null,
          reweight_status: Number.isFinite(reweightStatusNum) ? reweightStatusNum : 0,
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

  async getDashboardSummary(): Promise<FleetDashboardSummaryResponseDto> {
    const sequelize = this.orderModel.sequelize as Sequelize;

    try {
      const hubs = await this.hubModel.findAll({
        attributes: ['id', 'kode', 'nama'],
        order: [['nama', 'ASC']],
      });

      const hubMap = new Map<number, FleetDashboardHubSummaryDto>();
      for (const h of hubs) {
        hubMap.set(h.id, {
          hub_id: h.getDataValue('id'),
          hub_kode: h.getDataValue('kode') || '',
          hub_name: h.getDataValue('nama') || '',
          order_jemput: 0,
          inbound: 0,
          outbound: 0,
          order_kirim: 0,
          vendor: 0,
          completed: 0,
        });
      }

      const total: FleetDashboardTotalSummaryDto = {
        order_jemput: 0,
        inbound: 0,
        outbound: 0,
        order_kirim: 0,
        vendor: 0,
        completed: 0,
        total: 0,
      };

      // 2. order jemput - group by hub_source_id
      const orderJemputRows: { hub_id: number; cnt: number }[] = await sequelize.query(
        `SELECT hub_source_id AS hub_id, COUNT(*) AS cnt
         FROM orders
         WHERE (status_pickup IS NULL OR status_pickup IN ('siap pickup', 'Picked Up', 'Completed', 'Failed'))
           AND is_gagal_pickup = 0
           AND issetManifest_inbound = 0
           AND issetManifest_outbound = 0
           AND hub_source_id IS NOT NULL AND hub_source_id > 0
         GROUP BY hub_source_id`,
        { type: QueryTypes.SELECT },
      );
      for (const row of orderJemputRows) {
        const hubId = Number(row.hub_id);
        const cnt = Number(row.cnt);
        if (hubMap.has(hubId)) hubMap.get(hubId)!.order_jemput = cnt;
        total.order_jemput += cnt;
      }

      // 3. inbound - group by next_hub
      const inboundRows: { hub_id: number; cnt: number }[] = await sequelize.query(
        `SELECT CAST(next_hub AS UNSIGNED) AS hub_id, COUNT(*) AS cnt
         FROM orders
         WHERE status = 'In Transit'
           AND (vendor_tracking_number IS NULL OR vendor_tracking_number = '')
           AND next_hub IS NOT NULL AND next_hub != ''
         GROUP BY next_hub`,
        { type: QueryTypes.SELECT },
      );
      for (const row of inboundRows) {
        const hubId = Number(row.hub_id);
        const cnt = Number(row.cnt);
        if (hubMap.has(hubId)) hubMap.get(hubId)!.inbound = cnt;
        total.inbound += cnt;
      }

      // 4. outbound - group by current_hub
      const outboundRows: { hub_id: number; cnt: number }[] = await sequelize.query(
        `SELECT CAST(current_hub AS UNSIGNED) AS hub_id, COUNT(*) AS cnt
         FROM orders
         WHERE status = 'In Transit'
           AND issetManifest_outbound = 1
           AND current_hub IS NOT NULL AND current_hub != ''
         GROUP BY current_hub`,
        { type: QueryTypes.SELECT },
      );
      for (const row of outboundRows) {
        const hubId = Number(row.hub_id);
        const cnt = Number(row.cnt);
        if (hubMap.has(hubId)) hubMap.get(hubId)!.outbound = cnt;
        total.outbound += cnt;
      }

      // 5. order kirim - group by current_hub
      const orderKirimRows: { hub_id: number; cnt: number }[] = await sequelize.query(
        `SELECT CAST(current_hub AS UNSIGNED) AS hub_id, COUNT(*) AS cnt
         FROM orders
         WHERE status = 'Out for Delivery'
           AND current_hub IS NOT NULL AND current_hub != ''
         GROUP BY current_hub`,
        { type: QueryTypes.SELECT },
      );
      for (const row of orderKirimRows) {
        const hubId = Number(row.hub_id);
        const cnt = Number(row.cnt);
        if (hubMap.has(hubId)) hubMap.get(hubId)!.order_kirim = cnt;
        total.order_kirim += cnt;
      }

      // 6. vendor - group by current_hub or hub_source_id
      const vendorRows: { hub_id: number; cnt: number }[] = await sequelize.query(
        `SELECT hub_id, COUNT(*) AS cnt
         FROM (
           SELECT CASE
             WHEN current_hub IS NOT NULL AND TRIM(current_hub) != '' THEN CAST(current_hub AS UNSIGNED)
             ELSE hub_source_id
           END AS hub_id
           FROM orders
           WHERE vendor_id IS NOT NULL
             AND vendor_tracking_number IS NOT NULL
             AND vendor_tracking_number != ''
         ) sub
         WHERE hub_id IS NOT NULL AND hub_id > 0
         GROUP BY hub_id`,
        { type: QueryTypes.SELECT },
      );
      for (const row of vendorRows) {
        const hubId = Number(row.hub_id);
        const cnt = Number(row.cnt);
        if (hubMap.has(hubId)) hubMap.get(hubId)!.vendor = cnt;
        total.vendor += cnt;
      }

      // 7. completed - group by current_hub
      const completedRows: { hub_id: number; cnt: number }[] = await sequelize.query(
        `SELECT CAST(current_hub AS UNSIGNED) AS hub_id, COUNT(*) AS cnt
         FROM orders
         WHERE status = 'Delivered'
           AND current_hub IS NOT NULL AND current_hub != ''
         GROUP BY current_hub`,
        { type: QueryTypes.SELECT },
      );
      for (const row of completedRows) {
        const hubId = Number(row.hub_id);
        const cnt = Number(row.cnt);
        if (hubMap.has(hubId)) hubMap.get(hubId)!.completed = cnt;
        total.completed += cnt;
      }

      // 8. Urutkan hub by nama
      const hubsData = Array.from(hubMap.values()).sort(
        (a, b) => a.hub_name.localeCompare(b.hub_name),
      );

      // 9. Total = jumlah semua status
      const totalAll =
        total.order_jemput +
        total.inbound +
        total.outbound +
        total.order_kirim +
        total.vendor +
        total.completed;

      return {
        hubs: hubsData,
        total: {
          ...total,
          total: totalAll,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error in getDashboardSummary: ${error.message}`, error.stack);
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

