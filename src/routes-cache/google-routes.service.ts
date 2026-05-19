import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import axios, { AxiosError } from 'axios';
import { MasterRoute } from '../models/master-route.model';
import { ApiUsageLog } from '../models/api-usage-log.model';
import {
  GoogleTollMoneyDto,
  parseGoogleDurationMinutes,
  pickTollEstimatedPrice,
  parseTollPassesFromEnv,
} from './helpers/google-toll.helper';

/** Radius (km) toleransi proximity match koordinat */
const PROXIMITY_RADIUS_KM = 0.5;

/** Batas harian Google Routes API (80% dari free tier 10.000) */
const GOOGLE_DAILY_LIMIT = 8000;

/** Nama service untuk api_usage_log */
const SERVICE_NAME = 'google_routes';

/** Cache TTL: rute diperbarui setelah 7 hari */
const CACHE_TTL_DAYS = 7;

const ROUTE_MATRIX_URL =
  'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';

/** Field mask sesuai dokumentasi Google untuk toll matrix */
const ROUTE_MATRIX_TOLL_FIELD_MASK =
  'originIndex,destinationIndex,status,condition,distanceMeters,duration,travelAdvisory.tollInfo';

const ROUTE_MATRIX_DISTANCE_FIELD_MASK =
  'originIndex,destinationIndex,status,condition,distanceMeters,duration';

export interface RouteDistanceResult {
  distanceTollKm: number;
  distanceNonTollKm: number;
  durationTollMin: number;
  durationNonTollMin: number;
  tollCostEstimateIdr: number | null;
  tollCostAmount: number | null;
  tollCostCurrency: string | null;
  tollEstimatedPrices: GoogleTollMoneyDto[];
  source: 'google' | 'mapbox' | 'fallback' | 'cache';
  googleError?: string;
}

interface MatrixCellResult {
  distanceKm: number;
  durationMin: number;
  tollCostAmount: number | null;
  tollCostCurrency: string | null;
  tollEstimatedPrices: GoogleTollMoneyDto[];
}

@Injectable()
export class GoogleRoutesService {
  private readonly logger = new Logger(GoogleRoutesService.name);
  private readonly googleApiKey = process.env.GOOGLE_ROUTES_API_KEY;
  private readonly tollPasses = parseTollPassesFromEnv(
    process.env.GOOGLE_ROUTES_TOLL_PASSES,
  );
  private readonly vehicleEmissionType =
    process.env.GOOGLE_ROUTES_VEHICLE_EMISSION?.trim() || 'DIESEL';

  constructor(
    @InjectModel(MasterRoute)
    private readonly masterRouteModel: typeof MasterRoute,
    @InjectModel(ApiUsageLog)
    private readonly apiUsageLogModel: typeof ApiUsageLog,
  ) {}

  /**
   * Cari cache rute Google yang masih valid (abaikan cache mapbox).
   */
  async findCachedRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<MasterRoute | null> {
    const delta = PROXIMITY_RADIUS_KM / 111.0;

    const row = await this.masterRouteModel.findOne({
      where: {
        origin_lat: { [Op.between]: [originLat - delta, originLat + delta] },
        origin_lng: { [Op.between]: [originLng - delta, originLng + delta] },
        destination_lat: { [Op.between]: [destLat - delta, destLat + delta] },
        destination_lng: { [Op.between]: [destLng - delta, destLng + delta] },
        distance_km_toll: { [Op.not]: null },
        distance_km_non_toll: { [Op.not]: null },
        google_routes_source: 'google',
      },
      order: [['google_routes_refreshed_at', 'DESC']],
    });

    if (!row) return null;

    const refreshedAt = row.getDataValue('google_routes_refreshed_at') as Date | null;
    if (!refreshedAt) return null;

    const ageDays =
      (Date.now() - new Date(refreshedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > CACHE_TTL_DAYS) {
      this.logger.log(
        `Cache Google expired (${ageDays.toFixed(1)} hari), akan refresh`,
      );
      return null;
    }

    this.logger.log(`Cache HIT (google): id=${row.id}`);
    return row;
  }

  async upsertRouteCache(
    originLat: number,
    originLng: number,
    originName: string,
    destLat: number,
    destLng: number,
    destName: string,
    result: {
      distanceTollKm: number;
      distanceNonTollKm: number;
      durationTollMin: number;
      durationNonTollMin: number;
      tollCostEstimateIdr: number | null;
      source: 'google' | 'mapbox' | 'fallback';
    },
  ): Promise<MasterRoute> {
    const delta = PROXIMITY_RADIUS_KM / 111.0;

    const existing = await this.masterRouteModel.findOne({
      where: {
        origin_lat: { [Op.between]: [originLat - delta, originLat + delta] },
        origin_lng: { [Op.between]: [originLng - delta, originLng + delta] },
        destination_lat: { [Op.between]: [destLat - delta, destLat + delta] },
        destination_lng: { [Op.between]: [destLng - delta, destLng + delta] },
      },
    });

    const now = new Date();
    const updateFields = {
      distance_km_toll: result.distanceTollKm,
      distance_km_non_toll: result.distanceNonTollKm,
      duration_min_toll: result.durationTollMin,
      duration_min_non_toll: result.durationNonTollMin,
      toll_cost_estimate_idr: result.tollCostEstimateIdr,
      google_routes_source: result.source,
      google_routes_refreshed_at: now,
    };

    if (existing) {
      await existing.update(updateFields);
      return existing;
    }

    const code = `CACHE-${Date.now().toString().slice(-8)}`;
    return this.masterRouteModel.create({
      route_code: code,
      origin_name: originName || `${originLat.toFixed(4)},${originLng.toFixed(4)}`,
      origin_lat: originLat,
      origin_lng: originLng,
      destination_name: destName || `${destLat.toFixed(4)},${destLng.toFixed(4)}`,
      destination_lat: destLat,
      destination_lng: destLng,
      route_type: 'one_way',
      road_constraint: 'campuran',
      default_distance_km: result.distanceTollKm,
      default_duration_min: Math.round(result.durationTollMin),
      ...updateFields,
    } as any);
  }

  async checkAndIncrementQuota(hits = 1): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const [row] = await this.apiUsageLogModel.findOrCreate({
      where: { service: SERVICE_NAME, date: today },
      defaults: {
        service: SERVICE_NAME,
        date: today,
        hit_count: 0,
        created_at: new Date(),
      } as any,
    });

    const currentCount = Number(row.getDataValue('hit_count') ?? 0);
    if (currentCount + hits > GOOGLE_DAILY_LIMIT) {
      this.logger.warn(
        `Kuota Google Routes API harian tercapai: ${currentCount}/${GOOGLE_DAILY_LIMIT}`,
      );
      return false;
    }

    await row.update({
      hit_count: currentCount + hits,
      updated_at: new Date(),
    });

    this.logger.log(
      `Google Routes API hit count hari ini: ${currentCount + hits}/${GOOGLE_DAILY_LIMIT}`,
    );
    return true;
  }

  async getTodayHitCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const row = await this.apiUsageLogModel.findOne({
      where: { service: SERVICE_NAME, date: today },
    });
    return row ? Number(row.getDataValue('hit_count') ?? 0) : 0;
  }

  /**
   * computeRouteMatrix — sesuai dokumentasi Google untuk estimasi tol.
   * @see https://developers.google.com/maps/documentation/routes/calculate_toll-rm
   */
  async callGoogleRouteMatrix(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    options: { avoidTolls: boolean; includeTollPricing: boolean },
  ): Promise<MatrixCellResult> {
    if (!this.googleApiKey) {
      throw new Error('GOOGLE_ROUTES_API_KEY belum dikonfigurasi di .env');
    }

    const originEntry: Record<string, unknown> = {
      waypoint: {
        location: {
          latLng: { latitude: originLat, longitude: originLng },
        },
      },
      routeModifiers: {
        vehicleInfo: {
          emissionType: this.vehicleEmissionType,
        },
        ...(options.avoidTolls ? { avoidTolls: true } : {}),
        ...(options.includeTollPricing
          ? { tollPasses: this.tollPasses }
          : {}),
      },
    };

    const body: Record<string, unknown> = {
      origins: [originEntry],
      destinations: [
        {
          waypoint: {
            location: {
              latLng: { latitude: destLat, longitude: destLng },
            },
          },
        },
      ],
      travelMode: 'DRIVE',
    };

    if (options.includeTollPricing) {
      body.extraComputations = ['TOLLS'];
    }

    const fieldMask = options.includeTollPricing
      ? ROUTE_MATRIX_TOLL_FIELD_MASK
      : ROUTE_MATRIX_DISTANCE_FIELD_MASK;

    const response = await axios.post(ROUTE_MATRIX_URL, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.googleApiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      timeout: 15000,
    });

    const cells = Array.isArray(response.data) ? response.data : [response.data];
    const cell = cells[0];

    if (!cell) {
      throw new Error('Google Route Matrix: respons kosong');
    }

    if (cell.condition && cell.condition !== 'ROUTE_EXISTS') {
      throw new Error(
        `Google Route Matrix: rute tidak tersedia (${cell.condition})`,
      );
    }

    const distanceKm = (cell.distanceMeters || 0) / 1000;
    const durationMin = parseGoogleDurationMinutes(cell.duration);

    const estimatedPrice: GoogleTollMoneyDto[] =
      cell.travelAdvisory?.tollInfo?.estimatedPrice ?? [];

    const picked = pickTollEstimatedPrice(estimatedPrice);

    return {
      distanceKm,
      durationMin,
      tollCostAmount: picked?.amount ?? null,
      tollCostCurrency: picked?.currencyCode ?? null,
      tollEstimatedPrices: estimatedPrice,
    };
  }

  private formatGoogleError(err: unknown): string {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const data = err.response?.data;
      const detail =
        typeof data === 'object'
          ? JSON.stringify(data)
          : String(data ?? err.message);
      return `HTTP ${status}: ${detail}`;
    }
    return err instanceof Error ? err.message : String(err);
  }

  async getRouteDistances(
    originLatLng: string,
    destLatLng: string,
    mapboxFallback: (
      avoidToll: boolean,
    ) => Promise<{ distance: number; duration: number }>,
  ): Promise<RouteDistanceResult> {
    const [originLat, originLng] = originLatLng.split(',').map(Number);
    const [destLat, destLng] = destLatLng.split(',').map(Number);

    const cached = await this.findCachedRoute(
      originLat,
      originLng,
      destLat,
      destLng,
    );
    if (cached) {
      const idr = cached.getDataValue('toll_cost_estimate_idr');
      return {
        distanceTollKm: Number(cached.getDataValue('distance_km_toll')),
        distanceNonTollKm: Number(cached.getDataValue('distance_km_non_toll')),
        durationTollMin: Number(cached.getDataValue('duration_min_toll')),
        durationNonTollMin: Number(
          cached.getDataValue('duration_min_non_toll'),
        ),
        tollCostEstimateIdr: idr != null ? Number(idr) : null,
        tollCostAmount: idr != null ? Number(idr) : null,
        tollCostCurrency: idr != null ? 'IDR' : null,
        tollEstimatedPrices: [],
        source: 'cache',
      };
    }

    let googleError: string | undefined;

    if (this.googleApiKey) {
      const quotaOk = await this.checkAndIncrementQuota(2);
      if (quotaOk) {
        try {
          const [tollMatrix, nonTollMatrix] = await Promise.all([
            this.callGoogleRouteMatrix(
              originLat,
              originLng,
              destLat,
              destLng,
              { avoidTolls: false, includeTollPricing: true },
            ),
            this.callGoogleRouteMatrix(
              originLat,
              originLng,
              destLat,
              destLng,
              { avoidTolls: true, includeTollPricing: false },
            ),
          ]);

          const tollIdr =
            tollMatrix.tollCostCurrency === 'IDR'
              ? tollMatrix.tollCostAmount
              : null;

          const result: RouteDistanceResult = {
            distanceTollKm:
              Math.round(tollMatrix.distanceKm * 100) / 100,
            distanceNonTollKm:
              Math.round(nonTollMatrix.distanceKm * 100) / 100,
            durationTollMin:
              Math.round(tollMatrix.durationMin * 10) / 10,
            durationNonTollMin:
              Math.round(nonTollMatrix.durationMin * 10) / 10,
            tollCostEstimateIdr: tollIdr,
            tollCostAmount: tollMatrix.tollCostAmount,
            tollCostCurrency: tollMatrix.tollCostCurrency,
            tollEstimatedPrices: tollMatrix.tollEstimatedPrices,
            source: 'google',
          };

          await this.upsertRouteCache(
            originLat,
            originLng,
            '',
            destLat,
            destLng,
            '',
            {
              distanceTollKm: result.distanceTollKm,
              distanceNonTollKm: result.distanceNonTollKm,
              durationTollMin: result.durationTollMin,
              durationNonTollMin: result.durationNonTollMin,
              tollCostEstimateIdr: tollIdr,
              source: 'google',
            },
          ).catch((e) =>
            this.logger.warn(`Gagal simpan cache Google: ${e.message}`),
          );

          this.logger.log(
            `Google Matrix: tol=${result.distanceTollKm}km, biaya=${result.tollCostAmount ?? 'N/A'} ${result.tollCostCurrency ?? ''}`,
          );
          return result;
        } catch (err) {
          googleError = this.formatGoogleError(err);
          this.logger.warn(
            `Google Route Matrix error, fallback ke Mapbox: ${googleError}`,
          );
        }
      } else {
        googleError = 'Kuota harian Google Routes API habis';
        this.logger.warn(googleError);
      }
    } else {
      googleError = 'GOOGLE_ROUTES_API_KEY tidak dikonfigurasi';
    }

    const [tollFb, nonTollFb] = await Promise.all([
      mapboxFallback(false),
      mapboxFallback(true),
    ]);

    const fbResult: RouteDistanceResult = {
      distanceTollKm: Math.round(tollFb.distance * 100) / 100,
      distanceNonTollKm: Math.round(nonTollFb.distance * 100) / 100,
      durationTollMin: Math.round(tollFb.duration * 10) / 10,
      durationNonTollMin: Math.round(nonTollFb.duration * 10) / 10,
      tollCostEstimateIdr: null,
      tollCostAmount: null,
      tollCostCurrency: null,
      tollEstimatedPrices: [],
      source: 'mapbox',
      googleError,
    };

    return fbResult;
  }
}
