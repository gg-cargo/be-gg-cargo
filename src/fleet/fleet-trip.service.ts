import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { FleetTrip } from '../models/fleet-trip.model';
import { FleetTripWaypoint } from '../models/fleet-trip-waypoint.model';
import { FleetTripSegment } from '../models/fleet-trip-segment.model';
import { FleetTripAssignment } from '../models/fleet-trip-assignment.model';
import { FleetTripLoadingPhoto } from '../models/fleet-trip-loading-photo.model';
import { FileLog } from '../models/file-log.model';
import { UsersBank } from '../models/users-bank.model';
import { User } from '../models/user.model';
import { Vendor } from '../models/vendor.model';
import { UpdateFleetTripLoadingPhotosDto } from './dto/update-fleet-trip-loading-photos.dto';
import { UpdateFleetTripApproveStatusDto } from './dto/update-fleet-trip-approve-status.dto';
import {
  CreateFleetTripDto,
  FleetTripAssigneeTypeDto,
} from './dto/create-fleet-trip.dto';
import {
  FleetTripDetailDto,
  FleetTripListResponseDto,
  FleetTripLoadingPhotosResponseDto,
  FleetTripResponseDto,
} from './dto/fleet-trip-response.dto';
import { ListFleetTripsQueryDto } from './dto/list-fleet-trips-query.dto';
import {
  buildFleetTrackingNo,
  fleetTrackingNoPrefixForDate,
} from './helpers/generate-fleet-tracking-no.helper';
import {
  parseDurationToMinutes,
  sumSegmentDurations,
} from './helpers/parse-duration-minutes.helper';
import {
  mapFleetTripListItem,
  mapFleetTripLoadingPhotos,
  mapFleetTripToDetail,
  resolvePlatKendaraanForAssignment,
} from './helpers/map-fleet-trip.helper';

@Injectable()
export class FleetTripService {
  private readonly logger = new Logger(FleetTripService.name);

  constructor(
    @InjectModel(FleetTrip)
    private readonly fleetTripModel: typeof FleetTrip,
    @InjectModel(FleetTripWaypoint)
    private readonly waypointModel: typeof FleetTripWaypoint,
    @InjectModel(FleetTripSegment)
    private readonly segmentModel: typeof FleetTripSegment,
    @InjectModel(FleetTripAssignment)
    private readonly assignmentModel: typeof FleetTripAssignment,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(FleetTripLoadingPhoto)
    private readonly loadingPhotoModel: typeof FleetTripLoadingPhoto,
    @InjectModel(FileLog)
    private readonly fileLogModel: typeof FileLog,
    @InjectModel(UsersBank)
    private readonly usersBankModel: typeof UsersBank,
    private readonly sequelize: Sequelize,
  ) {}

  async create(
    dto: CreateFleetTripDto,
    createdByUserId?: number,
  ): Promise<FleetTripResponseDto> {
    await this.validateAssignment(dto);

    const transaction = await this.sequelize.transaction();
    try {
      const trackingNo =
        dto.tracking_no?.trim() ||
        (await this.generateUniqueTrackingNo(transaction));

      const existing = await this.fleetTripModel.findOne({
        where: { tracking_no: trackingNo },
        transaction,
      });
      if (existing) {
        throw new ConflictException(`tracking_no ${trackingNo} sudah digunakan`);
      }

      const summary = dto.summary;
      const waktuMenit =
        parseDurationToMinutes(summary.estimasi_waktu_tiba) ??
        sumSegmentDurations(dto.segments.map((s) => s.route.estimasi_waktu));

      const trip = await this.fleetTripModel.create(
        {
          tracking_no: trackingNo,
          trip_type: summary.trip_type,
          road_type: summary.road_type,
          kota_asal: summary.kota_asal.trim(),
          kota_tujuan: summary.kota_tujuan.trim(),
          vehicle_type: summary.vehicle_type.trim(),
          distance_km_total: summary.distance_km_total,
          estimasi_bbm_total: summary.estimasi_bbm_total,
          estimasi_tol_total: summary.estimasi_tol_total,
          estimasi_waktu_tiba: summary.estimasi_waktu_tiba,
          estimasi_waktu_menit: waktuMenit,
          supir_1_total: summary.supir_1_total,
          supir_2_total: summary.supir_2_total ?? null,
          supir_2_eligible: summary.supir_2_eligible,
          grand_total_operational: summary.grand_total_operational,
          fuel_type: summary.fuel_type?.trim() || null,
          status: 'draft',
          approve_status: 'pending',
          created_by_user_id: createdByUserId ?? dto.assignment.assigned_by_user_id,
          created_at: new Date(),
        } as any,
        { transaction },
      );

      const tripId = trip.id;

      const sortedWaypoints = [...dto.waypoints].sort(
        (a, b) => a.sequence - b.sequence,
      );
      await this.waypointModel.bulkCreate(
        sortedWaypoints.map((w) => ({
          fleet_trip_id: tripId,
          sequence: w.sequence,
          label: w.label.trim(),
          lat: w.lat,
          lng: w.lng,
          address: w.address?.trim() || null,
        })) as any,
        { transaction },
      );

      await this.segmentModel.bulkCreate(
        dto.segments.map((s) => ({
          fleet_trip_id: tripId,
          segment_no: s.segment_no,
          titik_asal: s.titik_asal.trim(),
          titik_tujuan: s.titik_tujuan.trim(),
          titik_asal_lat: s.titik_asal_lat,
          titik_asal_lng: s.titik_asal_lng,
          titik_tujuan_lat: s.titik_tujuan_lat,
          titik_tujuan_lng: s.titik_tujuan_lng,
          road_type: s.road_type,
          distance_km: s.distance_km,
          route_variant: s.route.variant,
          route_jarak_km: s.route.jarak_km,
          route_estimasi_waktu: s.route.estimasi_waktu,
          route_biaya_tol_idr: s.route.biaya_tol_idr ?? null,
          estimate_bbm_total: s.estimate.bbm_total,
          estimate_fuel_type: s.estimate.fuel_type,
          estimate_toll_total: s.estimate.toll_total ?? null,
          estimate_distance_km_effective: s.estimate.distance_km_effective,
          estimate_grand_total_operational: s.estimate.grand_total_operational,
        })) as any,
        { transaction },
      );

      const assign = dto.assignment;
      await this.assignmentModel.create(
        {
          fleet_trip_id: tripId,
          assignee_type: assign.assignee_type,
          assigned_by_user_id: assign.assigned_by_user_id,
          driver_1_user_id:
            assign.assignee_type === FleetTripAssigneeTypeDto.MITRA
              ? assign.driver_1_user_id ?? null
              : null,
          driver_2_user_id:
            assign.assignee_type === FleetTripAssigneeTypeDto.MITRA
              ? assign.driver_2_user_id ?? null
              : null,
          vendor_id:
            assign.assignee_type === FleetTripAssigneeTypeDto.VENDOR
              ? assign.vendor_id ?? null
              : null,
        } as any,
        { transaction },
      );

      await transaction.commit();

      const detail = await this.findDetailByTrackingNo(trackingNo);
      return {
        success: true,
        message: 'Fleet trip berhasil disimpan',
        data: detail,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async updateLoadingPhotos(
    trackingNo: string,
    dto: UpdateFleetTripLoadingPhotosDto,
  ): Promise<FleetTripLoadingPhotosResponseDto> {
    const uniqueIds = [...new Set(dto.file_log_ids)];

    const trip = await this.findTripByTrackingNoOrThrow(trackingNo);

    const files = await this.fileLogModel.findAll({
      where: { id: { [Op.in]: uniqueIds } },
    });
    if (files.length !== uniqueIds.length) {
      const found = new Set(files.map((f) => f.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `file_log_id tidak ditemukan: ${missing.join(', ')}`,
      );
    }

    const tripId = trip.id;
    const transaction = await this.sequelize.transaction();
    try {
      await this.loadingPhotoModel.destroy({
        where: { fleet_trip_id: tripId },
        transaction,
      });

      await this.loadingPhotoModel.bulkCreate(
        uniqueIds.map((fileLogId, index) => ({
          fleet_trip_id: tripId,
          file_log_id: fileLogId,
          sort_order: index,
          created_at: new Date(),
        })) as any,
        { transaction },
      );

      await trip.update(
        {
          approve_status: 'pending',
          approve_by_user_id: null,
          approve_at: null,
          updated_at: new Date(),
        } as any,
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    this.logger.log(
      `Loading photos updated: tracking=${trackingNo}, count=${uniqueIds.length}`,
    );

    return this.buildLoadingPhotosResponse(
      tripId,
      'Foto muat berhasil diperbarui',
    );
  }

  async getLoadingPhotos(
    trackingNo: string,
  ): Promise<FleetTripLoadingPhotosResponseDto> {
    const trip = await this.findTripByTrackingNoOrThrow(trackingNo);
    return this.buildLoadingPhotosResponse(
      trip.id,
      'Foto muat berhasil diambil',
    );
  }

  /**
   * Ubah approve_status fleet trip (pending → approved / rejected).
   */
  async updateApproveStatus(
    trackingNo: string,
    dto: UpdateFleetTripApproveStatusDto,
    approveByUserId: number,
  ): Promise<FleetTripResponseDto> {
    const trip = await this.findTripByTrackingNoOrThrow(trackingNo);

    const currentStatus = trip.getDataValue('approve_status');
    if (currentStatus !== 'pending') {
      throw new BadRequestException(
        `Fleet trip sudah berstatus ${currentStatus} dan tidak dapat diubah lagi`,
      );
    }

    const approver = await this.userModel.findByPk(approveByUserId);
    if (!approver) {
      throw new BadRequestException('User approver tidak ditemukan');
    }

    const now = new Date();
    await trip.update({
      approve_status: dto.approve_status,
      approve_by_user_id: approveByUserId,
      approve_at: now,
      updated_at: now,
    } as any);

    this.logger.log(
      `Fleet trip approval diupdate: tracking=${trackingNo}, status=${dto.approve_status}, by=${approveByUserId}`,
    );

    const statusLabel = dto.approve_status === 'approved' ? 'disetujui' : 'ditolak';
    const detail = await this.findDetailByTrackingNo(trackingNo);

    return {
      success: true,
      message: `Fleet trip berhasil ${statusLabel}`,
      data: detail,
    };
  }

  async findByTrackingNo(trackingNo: string): Promise<FleetTripResponseDto> {
    const detail = await this.findDetailByTrackingNo(trackingNo);
    return {
      success: true,
      message: 'Detail fleet trip berhasil diambil',
      data: detail,
    };
  }

  async list(query: ListFleetTripsQueryDto): Promise<FleetTripListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const q = `%${query.search.trim()}%`;
      where[Op.or as any] = [
        { tracking_no: { [Op.like]: q } },
        { kota_asal: { [Op.like]: q } },
        { kota_tujuan: { [Op.like]: q } },
      ];
    }

    const { count, rows } = await this.fleetTripModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: FleetTripAssignment,
          as: 'assignment',
          required: false,
          attributes: [
            'assignee_type',
            'driver_1_user_id',
            'driver_2_user_id',
          ],
        },
        {
          model: User,
          as: 'approveByUser',
          required: false,
          attributes: ['id', 'name'],
        },
      ],
    });

    const platByDriverId = await this.loadPlatKendaraanByDriverUserIds(
      this.collectDriverUserIdsFromTrips(rows),
    );

    return {
      success: true,
      message: 'Daftar fleet trip berhasil diambil',
      data: {
        total: count,
        page,
        limit,
        items: rows.map((r) => {
          const assignment = r.getDataValue('assignment') as
            | FleetTripAssignment
            | undefined;
          const plat = resolvePlatKendaraanForAssignment(
            assignment,
            platByDriverId,
          );
          return mapFleetTripListItem(r, plat);
        }),
      },
    };
  }

  private collectDriverUserIdsFromTrips(trips: FleetTrip[]): number[] {
    const ids = new Set<number>();
    for (const trip of trips) {
      const assignment = trip.getDataValue('assignment') as
        | FleetTripAssignment
        | undefined;
      if (!assignment) {
        continue;
      }
      const d1 = assignment.getDataValue('driver_1_user_id') as number | null;
      const d2 = assignment.getDataValue('driver_2_user_id') as number | null;
      if (d1 != null) {
        ids.add(Number(d1));
      }
      if (d2 != null) {
        ids.add(Number(d2));
      }
    }
    return [...ids];
  }

  /**
   * Plat dari note kirim (order_delivery_notes.no_polisi) atau orders.truck_id
   * setelah note kirim dibuat untuk order driver terkait.
   */
  private async loadPlatKendaraanByDriverUserIds(
    userIds: number[],
  ): Promise<Record<string, string>> {
    if (userIds.length === 0) {
      return {};
    }

    const result: Record<string, string> = {};

    const fromDeliveryNotes = (await this.sequelize.query(
      `SELECT dn.transporter_id, dn.no_polisi
       FROM order_delivery_notes dn
       INNER JOIN (
         SELECT transporter_id, MAX(id) AS max_id
         FROM order_delivery_notes
         WHERE transporter_id IN (:userIds)
           AND no_polisi IS NOT NULL
           AND TRIM(no_polisi) <> ''
         GROUP BY transporter_id
       ) latest ON latest.max_id = dn.id`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT,
      },
    )) as { transporter_id: number; no_polisi: string }[];

    for (const row of fromDeliveryNotes) {
      result[String(row.transporter_id)] = String(row.no_polisi).trim();
    }

    const missingIds = userIds.filter((id) => !result[String(id)]);
    if (missingIds.length === 0) {
      return result;
    }

    const transporterIdStrings = missingIds.map((id) => String(id));

    const fromOrdersTransporter = (await this.sequelize.query(
      `SELECT o.transporter_id, o.truck_id
       FROM orders o
       INNER JOIN (
         SELECT transporter_id, MAX(id) AS max_id
         FROM orders
         WHERE transporter_id IN (:transporterIds)
           AND truck_id IS NOT NULL
           AND TRIM(truck_id) <> ''
         GROUP BY transporter_id
       ) latest ON latest.max_id = o.id`,
      {
        replacements: { transporterIds: transporterIdStrings },
        type: QueryTypes.SELECT,
      },
    )) as { transporter_id: string; truck_id: string }[];

    for (const row of fromOrdersTransporter) {
      const key = String(row.transporter_id);
      if (!result[key]) {
        result[key] = String(row.truck_id).trim();
      }
    }

    const stillMissing = missingIds.filter((id) => !result[String(id)]);
    if (stillMissing.length === 0) {
      return result;
    }

    const fromPickupDrivers = (await this.sequelize.query(
      `SELECT opd.driver_id, o.truck_id
       FROM orders o
       INNER JOIN order_pickup_drivers opd ON opd.order_id = o.id
       INNER JOIN (
         SELECT opd2.driver_id, MAX(o2.id) AS max_order_id
         FROM orders o2
         INNER JOIN order_pickup_drivers opd2 ON opd2.order_id = o2.id
         WHERE opd2.driver_id IN (:userIds)
           AND o2.truck_id IS NOT NULL
           AND TRIM(o2.truck_id) <> ''
         GROUP BY opd2.driver_id
       ) latest ON latest.max_order_id = o.id AND latest.driver_id = opd.driver_id`,
      {
        replacements: { userIds: stillMissing },
        type: QueryTypes.SELECT,
      },
    )) as { driver_id: number; truck_id: string }[];

    for (const row of fromPickupDrivers) {
      const key = String(row.driver_id);
      if (!result[key]) {
        result[key] = String(row.truck_id).trim();
      }
    }

    const stillMissingAfterPickup = stillMissing.filter(
      (id) => !result[String(id)],
    );
    if (stillMissingAfterPickup.length === 0) {
      return result;
    }

    const fromTruckList = (await this.sequelize.query(
      `SELECT driver_id, no_polisi
       FROM truck_list
       WHERE driver_id IN (:userIds)
         AND no_polisi IS NOT NULL
         AND TRIM(no_polisi) <> ''`,
      {
        replacements: { userIds: stillMissingAfterPickup },
        type: QueryTypes.SELECT,
      },
    )) as { driver_id: number; no_polisi: string }[];

    for (const row of fromTruckList) {
      const key = String(row.driver_id);
      if (!result[key]) {
        result[key] = String(row.no_polisi).trim();
      }
    }

    return result;
  }

  private async findDetailByTrackingNo(
    trackingNo: string,
  ): Promise<FleetTripDetailDto> {
    const trip = await this.fleetTripModel.findOne({
      where: { tracking_no: trackingNo },
      include: [
        {
          model: FleetTripWaypoint,
          as: 'waypoints',
          separate: true,
          order: [['sequence', 'ASC']],
        },
        {
          model: FleetTripSegment,
          as: 'segments',
          separate: true,
          order: [['segment_no', 'ASC']],
        },
        {
          model: FleetTripAssignment,
          as: 'assignment',
          required: false,
          include: [
            {
              model: User,
              as: 'driver1',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              model: User,
              as: 'driver2',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              model: Vendor,
              as: 'vendor',
              attributes: [
                'id',
                'nama_vendor',
                'pic_nama',
                'pic_telepon',
                'pic_email',
              ],
              required: false,
            },
          ],
        },
        {
          model: FleetTripLoadingPhoto,
          as: 'loadingPhotos',
          separate: true,
          order: [['sort_order', 'ASC']],
          include: [
            {
              model: FileLog,
              as: 'fileLog',
              attributes: ['id', 'file_path', 'file_name'],
              required: false,
            },
          ],
        },
      ],
    });

    if (!trip) {
      throw new NotFoundException(`Fleet trip ${trackingNo} tidak ditemukan`);
    }

    const bankByUserId = await this.loadDriverBankAccountsByTrip(trip);
    return mapFleetTripToDetail(trip, bankByUserId);
  }

  private async loadDriverBankAccountsByTrip(
    trip: FleetTrip,
  ): Promise<Record<string, string>> {
    const assignment = trip.getDataValue('assignment') as
      | FleetTripAssignment
      | undefined;
    if (!assignment) {
      return {};
    }

    const userIds = [
      assignment.getDataValue('driver_1_user_id'),
      assignment.getDataValue('driver_2_user_id'),
    ]
      .filter((id): id is number => id != null)
      .map((id) => String(id));

    if (userIds.length === 0) {
      return {};
    }

    const banks = await this.usersBankModel.findAll({
      where: { id_user: { [Op.in]: userIds } },
      attributes: ['id_user', 'nomor_rekening'],
    });

    return Object.fromEntries(
      banks.map((b) => [
        String(b.getDataValue('id_user')),
        String(b.getDataValue('nomor_rekening')),
      ]),
    );
  }

  private async findTripByTrackingNoOrThrow(
    trackingNo: string,
  ): Promise<FleetTrip> {
    const trip = await this.fleetTripModel.findOne({
      where: { tracking_no: trackingNo },
    });
    if (!trip) {
      throw new NotFoundException(`Fleet trip ${trackingNo} tidak ditemukan`);
    }
    return trip;
  }

  private async buildLoadingPhotosResponse(
    tripId: number,
    message: string,
  ): Promise<FleetTripLoadingPhotosResponseDto> {
    const photoRows = await this.loadingPhotoModel.findAll({
      where: { fleet_trip_id: tripId },
      order: [['sort_order', 'ASC']],
      include: [
        {
          model: FileLog,
          as: 'fileLog',
          attributes: ['id', 'file_path', 'file_name'],
          required: true,
        },
      ],
    });

    return {
      success: true,
      message,
      data: {
        loading_photos: mapFleetTripLoadingPhotos(photoRows),
      },
    };
  }

  private async validateAssignment(dto: CreateFleetTripDto): Promise<void> {
    const a = dto.assignment;

    const assigner = await this.userModel.findByPk(a.assigned_by_user_id);
    if (!assigner) {
      throw new BadRequestException('assigned_by_user_id tidak ditemukan');
    }

    if (a.assignee_type === FleetTripAssigneeTypeDto.MITRA) {
      if (!a.driver_1_user_id) {
        throw new BadRequestException(
          'driver_1_user_id wajib untuk assignee_type mitra',
        );
      }
      const d1 = await this.userModel.findByPk(a.driver_1_user_id);
      if (!d1) {
        throw new BadRequestException('driver_1_user_id tidak ditemukan');
      }
      if (a.driver_2_user_id) {
        const d2 = await this.userModel.findByPk(a.driver_2_user_id);
        if (!d2) {
          throw new BadRequestException('driver_2_user_id tidak ditemukan');
        }
      }
    } else if (a.assignee_type === FleetTripAssigneeTypeDto.VENDOR) {
      if (!a.vendor_id) {
        throw new BadRequestException(
          'vendor_id wajib untuk assignee_type vendor',
        );
      }
      const vendor = await this.vendorModel.findByPk(a.vendor_id);
      if (!vendor) {
        throw new BadRequestException('vendor_id tidak ditemukan');
      }
    }
  }

  private async generateUniqueTrackingNo(
    transaction?: Transaction,
  ): Promise<string> {
    const now = new Date();
    const prefix = fleetTrackingNoPrefixForDate(now);

    const rows = (await this.sequelize.query(
      `SELECT MAX(CAST(SUBSTRING(tracking_no, 9) AS UNSIGNED)) AS max_suffix
       FROM fleet_trips
       WHERE tracking_no LIKE :prefix`,
      {
        replacements: { prefix: `${prefix}%` },
        type: QueryTypes.SELECT,
        transaction,
      },
    )) as { max_suffix: number | null }[];

    const maxSuffix = rows[0]?.max_suffix ?? 0;
    const next = Number(maxSuffix) + 1;
    if (next > 999) {
      throw new BadRequestException(
        'Kuota nomor tracking harian habis (maks 999/hari)',
      );
    }
    return buildFleetTrackingNo(now, next);
  }
}
