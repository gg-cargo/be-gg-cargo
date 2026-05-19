import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GoogleRoutesService } from './google-routes.service';
import {
  TollEstimateDataDto,
  TollEstimateResponseDto,
  TollEstimatedPriceDto,
} from './dto/toll-estimate-response.dto';
import {
  GoogleTollMoneyDto,
  parseGoogleMoney,
  parseTollPassesFromEnv,
  GOLONGAN_TOL_TRUK,
  getGolonganVTollMultiplier,
  applyGolonganVToll,
} from './helpers/google-toll.helper';

@Injectable()
export class RoutesCacheService {
  private readonly logger = new Logger(RoutesCacheService.name);
  private readonly mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;

  constructor(private readonly googleRoutesService: GoogleRoutesService) {}

  async getTollEstimate(
    originLatLng: string,
    destinationLatLng: string,
  ): Promise<TollEstimateResponseDto> {
    const routeData = await this.googleRoutesService.getRouteDistances(
      originLatLng,
      destinationLatLng,
      (avoidToll) => this.mapboxFallback(originLatLng, destinationLatLng, avoidToll),
    );

    const quotaToday = await this.googleRoutesService.getTodayHitCount();

    const tollKm = routeData.distanceTollKm;
    const nonTollKm = routeData.distanceNonTollKm;

    const multiplier = getGolonganVTollMultiplier();
    const mobilAmount = routeData.tollCostAmount;
    const mobilIdr = routeData.tollCostEstimateIdr;
    const golVAmount = applyGolonganVToll(mobilAmount, multiplier);
    const golVIdr = applyGolonganVToll(mobilIdr, multiplier);
    const currency = routeData.tollCostCurrency;

    const estimasiMobil = this.mapEstimatedPrices(routeData.tollEstimatedPrices);
    const estimasiGolV = this.mapEstimatedPricesGolonganV(
      routeData.tollEstimatedPrices,
      multiplier,
    );

    const data: TollEstimateDataDto = {
      origin: originLatLng,
      destination: destinationLatLng,
      source: routeData.source,
      via_tol: {
        jarak_km: tollKm,
        estimasi_waktu: this.formatDuration(routeData.durationTollMin),
        durasi_menit: Math.round(routeData.durationTollMin * 10) / 10,
        golongan_tol: GOLONGAN_TOL_TRUK,
        multiplier_golongan_v: multiplier,
        biaya_tol_mobil_idr: mobilIdr,
        biaya_tol_mobil:
          mobilAmount != null && currency
            ? this.formatMoney(mobilAmount, currency)
            : null,
        biaya_tol_idr: golVIdr,
        biaya_tol_amount: golVAmount,
        biaya_tol_currency: currency,
        biaya_tol:
          golVAmount != null && currency
            ? this.formatMoney(golVAmount, currency)
            : null,
        estimasi_harga_tol_mobil: estimasiMobil,
        estimasi_harga_tol: estimasiGolV,
      },
      non_tol: {
        jarak_km: nonTollKm,
        estimasi_waktu: this.formatDuration(routeData.durationNonTollMin),
        durasi_menit: Math.round(routeData.durationNonTollMin * 10) / 10,
      },
      selisih_jarak_km: Math.round((nonTollKm - tollKm) * 100) / 100,
      google_quota_hari_ini: quotaToday,
      google_error: routeData.googleError,
      toll_passes_used: parseTollPassesFromEnv(
        process.env.GOOGLE_ROUTES_TOLL_PASSES,
      ),
    };

    this.logger.log(
      `Toll estimate source=${routeData.source}, tol=${tollKm}km, ` +
        `mobil=${mobilIdr ?? 'N/A'}, gol_V=${golVIdr ?? 'N/A'} (×${multiplier})`,
    );

    return {
      success: true,
      message: 'Estimasi harga tol berhasil dihitung',
      data,
    };
  }

  private async mapboxFallback(
    originLatLng: string,
    destinationLatLng: string,
    avoidToll: boolean,
  ): Promise<{ distance: number; duration: number }> {
    if (this.mapboxAccessToken) {
      try {
        return await this.getDistanceFromMapbox(originLatLng, destinationLatLng, avoidToll);
      } catch (err) {
        this.logger.warn(`Mapbox fallback gagal: ${err.message}`);
      }
    }
    return this.haversineFallback(originLatLng, destinationLatLng, avoidToll);
  }

  private async getDistanceFromMapbox(
    originLatLng: string,
    destinationLatLng: string,
    excludeToll: boolean,
  ): Promise<{ distance: number; duration: number }> {
    const [originLat, originLng] = originLatLng.split(',').map((c) => parseFloat(c.trim()));
    const [destLat, destLng] = destinationLatLng.split(',').map((c) => parseFloat(c.trim()));

    const originCoords = `${originLng.toFixed(6)},${originLat.toFixed(6)}`;
    const destCoords = `${destLng.toFixed(6)},${destLat.toFixed(6)}`;

    const params = new URLSearchParams({
      access_token: this.mapboxAccessToken || '',
      geometries: 'geojson',
      overview: 'full',
    });
    if (excludeToll) {
      params.append('exclude', 'toll');
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords};${destCoords}?${params}`;

    const response = await axios.get(url, { timeout: 10000 });
    const route = response.data?.routes?.[0];
    if (!route) {
      throw new Error('Tidak ada rute ditemukan dari Mapbox');
    }

    return {
      distance: route.distance / 1000,
      duration: route.duration / 60,
    };
  }

  private haversineFallback(
    originLatLng: string,
    destinationLatLng: string,
    avoidToll: boolean,
  ): { distance: number; duration: number } {
    const [lat1, lon1] = originLatLng.split(',').map((c) => parseFloat(c.trim()));
    const [lat2, lon2] = destinationLatLng.split(',').map((c) => parseFloat(c.trim()));

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const km = avoidToll ? distance : distance * 0.85;
    const duration = (km / 50) * 60;

    return { distance: km, duration };
  }

  private formatDuration(durationMinutes: number): string {
    if (durationMinutes < 60) {
      return `${Math.round(durationMinutes)} menit`;
    }
    const hours = Math.floor(durationMinutes / 60);
    const minutes = Math.round(durationMinutes % 60);
    return minutes > 0 ? `${hours} jam ${minutes} menit` : `${hours} jam`;
  }

  private mapEstimatedPrices(
    prices: GoogleTollMoneyDto[],
  ): TollEstimatedPriceDto[] {
    if (!Array.isArray(prices)) return [];
    return prices.map((p) => {
      const amount = parseGoogleMoney(p);
      return {
        currency_code: p.currencyCode,
        amount,
        formatted: this.formatMoney(amount, p.currencyCode),
      };
    });
  }

  private mapEstimatedPricesGolonganV(
    prices: GoogleTollMoneyDto[],
    multiplier: number,
  ): TollEstimatedPriceDto[] {
    return this.mapEstimatedPrices(prices).map((p) => {
      const amount = applyGolonganVToll(p.amount, multiplier) ?? p.amount;
      return {
        currency_code: p.currency_code,
        amount,
        formatted: this.formatMoney(amount, p.currency_code),
      };
    });
  }

  private formatMoney(amount: number, currencyCode: string): string {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currencyCode} ${amount.toLocaleString('id-ID')}`;
    }
  }
}
