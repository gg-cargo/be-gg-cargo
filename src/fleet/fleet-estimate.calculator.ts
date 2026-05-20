import {
  FLEET_ESTIMATE_DRIVER_1_DEPOSIT,
  FLEET_ESTIMATE_DRIVER_1_FLAT_BELOW_300,
  FLEET_ESTIMATE_DRIVER_1_RATES,
  FLEET_ESTIMATE_DRIVER_2_DEPOSIT,
  FLEET_ESTIMATE_DRIVER_2_MIN_KM,
  FLEET_ESTIMATE_DRIVER_2_RATES,
  FLEET_ESTIMATE_FUEL_CONFIG,
  FLEET_ESTIMATE_TIER_LOW_MAX_KM,
  FLEET_ESTIMATE_TIER_MID_MAX_KM,
  FleetEstimateDriverTier,
  FleetEstimateVehicleType,
} from './constants/fleet-estimate.constants';
import { FleetEstimateDto, FleetEstimateTripType } from './dto/fleet-estimate.dto';

export interface FleetEstimateDriverDepositLine {
  rate_per_km: number;
  minimum_per_trip: number;
  total: number;
}

export interface FleetEstimateDriverLine {
  rate_per_km: number;
  tier: FleetEstimateDriverTier | null;
  gross_total: number;
  deposit: FleetEstimateDriverDepositLine;
  total: number;
}

export interface FleetEstimateSupir2Line extends FleetEstimateDriverLine {
  eligible: boolean;
}

export interface FleetEstimateBbmLine {
  fuel_type: string;
  formula: string;
  consumption_km_per_liter: number;
  price_per_liter: number;
  total: number;
}

export interface FleetEstimateResult {
  kota_asal: string;
  kota_tujuan: string;
  trip_type: FleetEstimateTripType;
  road_type: string;
  vehicle_type: FleetEstimateVehicleType;
  distance_km_input: number;
  distance_km_effective: number;
  supir_1: FleetEstimateDriverLine;
  supir_2: FleetEstimateSupir2Line;
  bbm: FleetEstimateBbmLine;
  grand_total_operational: number;
  notes: string[];
}

function resolveDriver1Compensation(effectiveKm: number): {
  tier: FleetEstimateDriverTier;
  ratePerKm: number;
  total: number;
} {
  if (effectiveKm < FLEET_ESTIMATE_TIER_LOW_MAX_KM) {
    return {
      tier: 'below_300',
      ratePerKm: 0,
      total: FLEET_ESTIMATE_DRIVER_1_FLAT_BELOW_300,
    };
  }
  if (effectiveKm <= FLEET_ESTIMATE_TIER_MID_MAX_KM) {
    const ratePerKm = FLEET_ESTIMATE_DRIVER_1_RATES.from_300_to_800;
    return {
      tier: 'from_300_to_800',
      ratePerKm,
      total: Math.round(effectiveKm * ratePerKm),
    };
  }
  const ratePerKm = FLEET_ESTIMATE_DRIVER_1_RATES.above_800;
  return {
    tier: 'above_800',
    ratePerKm,
    total: Math.round(effectiveKm * ratePerKm),
  };
}

function resolveDriver2Tier(effectiveKm: number): {
  tier: FleetEstimateDriverTier | null;
  ratePerKm: number;
} {
  if (effectiveKm <= FLEET_ESTIMATE_DRIVER_2_MIN_KM) {
    return { tier: null, ratePerKm: 0 };
  }
  if (effectiveKm <= FLEET_ESTIMATE_TIER_MID_MAX_KM) {
    return { tier: 'from_300_to_800', ratePerKm: FLEET_ESTIMATE_DRIVER_2_RATES.from_300_to_800 };
  }
  return { tier: 'above_800', ratePerKm: FLEET_ESTIMATE_DRIVER_2_RATES.above_800 };
}

function resolveDriverDeposit(
  effectiveKm: number,
  ratePerKm: number,
  minimumPerTrip: number,
): number {
  return Math.max(Math.round(effectiveKm * ratePerKm), minimumPerTrip);
}

function applyDepositToWage(
  grossTotal: number,
  effectiveKm: number,
  depositConfig: { ratePerKm: number; minimumPerTrip: number },
): { deposit: FleetEstimateDriverDepositLine; netTotal: number } {
  const depositTotal =
    grossTotal > 0
      ? resolveDriverDeposit(effectiveKm, depositConfig.ratePerKm, depositConfig.minimumPerTrip)
      : 0;
  return {
    deposit: {
      rate_per_km: depositConfig.ratePerKm,
      minimum_per_trip: depositConfig.minimumPerTrip,
      total: depositTotal,
    },
    netTotal: Math.max(0, grossTotal - depositTotal),
  };
}

/** Jarak satu arah dari fleet_trips.distance_km_total + trip_type */
export function resolveFleetTripDistanceKmInput(trip: {
  trip_type: string;
  distance_km_total: number | string;
}): number {
  const effectiveKm = Number(trip.distance_km_total);
  if (!Number.isFinite(effectiveKm) || effectiveKm <= 0) {
    throw new Error('distance_km_total trip tidak valid');
  }
  if (trip.trip_type === 'two_way') {
    return effectiveKm / 2;
  }
  return effectiveKm;
}

export function normalizeFleetVehicleType(raw: string): FleetEstimateVehicleType | null {
  const n = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (n.includes('CDDL') || (n.includes('CDD') && !n.includes('TRAGA'))) {
    return 'CDDL';
  }
  if (n.includes('TRAGA')) {
    return 'TRAGA';
  }
  if (n.includes('CARRY') || n.includes('CDE') || n.includes('PICKUP')) {
    return 'CARRY';
  }
  if (n === 'CDDL' || n === 'TRAGA' || n === 'CARRY') {
    return n as FleetEstimateVehicleType;
  }
  return null;
}

export function calculateFleetOperationalEstimate(dto: FleetEstimateDto): FleetEstimateResult {
  const effectiveKm =
    dto.trip_type === FleetEstimateTripType.TWO_WAY
      ? dto.distance_km * 2
      : dto.distance_km;

  const vehicleType = normalizeFleetVehicleType(dto.vehicle_type);
  if (!vehicleType) {
    throw new Error(`Tipe kendaraan tidak didukung: ${dto.vehicle_type}. Gunakan CDDL, TRAGA, atau CARRY.`);
  }
  const fuelConfig = FLEET_ESTIMATE_FUEL_CONFIG[vehicleType];

  const d1 = resolveDriver1Compensation(effectiveKm);
  const supir1Gross = d1.total;
  const supir1AfterDeposit = applyDepositToWage(
    supir1Gross,
    effectiveKm,
    FLEET_ESTIMATE_DRIVER_1_DEPOSIT,
  );

  const d2 = resolveDriver2Tier(effectiveKm);
  const supir2Eligible = effectiveKm > FLEET_ESTIMATE_DRIVER_2_MIN_KM;
  const supir2Gross = supir2Eligible ? Math.round(effectiveKm * d2.ratePerKm) : 0;
  const supir2AfterDeposit = applyDepositToWage(
    supir2Gross,
    effectiveKm,
    FLEET_ESTIMATE_DRIVER_2_DEPOSIT,
  );

  const bbmTotal = Math.round((effectiveKm / fuelConfig.kmPerLiter) * fuelConfig.pricePerLiter);

  const supir1Net = supir1AfterDeposit.netTotal;
  const supir2Net = supir2AfterDeposit.netTotal;
  const grandTotal = supir1Net + supir2Net + bbmTotal;

  const notes: string[] = [
    'Perhitungan biaya operasional (upah supir neto setelah deposit + BBM). Belum termasuk tol, feri, dan uang makan.',
    `Jarak efektif: ${effectiveKm} km (${dto.trip_type === FleetEstimateTripType.TWO_WAY ? 'pulang-pergi' : 'satu arah'}).`,
    `Deposit supir 1: Rp ${FLEET_ESTIMATE_DRIVER_1_DEPOSIT.ratePerKm}/km, min Rp ${FLEET_ESTIMATE_DRIVER_1_DEPOSIT.minimumPerTrip.toLocaleString('id-ID')}/trip.`,
    `Deposit supir 2: Rp ${FLEET_ESTIMATE_DRIVER_2_DEPOSIT.ratePerKm}/km, min Rp ${FLEET_ESTIMATE_DRIVER_2_DEPOSIT.minimumPerTrip.toLocaleString('id-ID')}/trip (jika ada supir 2).`,
  ];
  if (dto.road_type === 'manual') {
    notes.push('Jarak dari input manual; pastikan sesuai hasil peta.');
  }
  if (d1.tier === 'below_300') {
    notes.push(
      `Upah supir 1 bruto: flat Rp ${FLEET_ESTIMATE_DRIVER_1_FLAT_BELOW_300.toLocaleString('id-ID')} (jarak < ${FLEET_ESTIMATE_TIER_LOW_MAX_KM} km); neto setelah deposit.`,
    );
  }

  return {
    kota_asal: dto.kota_asal.trim(),
    kota_tujuan: dto.kota_tujuan.trim(),
    trip_type: dto.trip_type,
    road_type: dto.road_type,
    vehicle_type: vehicleType,
    distance_km_input: dto.distance_km,
    distance_km_effective: effectiveKm,
    supir_1: {
      rate_per_km: d1.ratePerKm,
      tier: d1.tier,
      gross_total: supir1Gross,
      deposit: supir1AfterDeposit.deposit,
      total: supir1Net,
    },
    supir_2: {
      eligible: supir2Eligible,
      rate_per_km: d2.ratePerKm,
      tier: d2.tier,
      gross_total: supir2Gross,
      deposit: supir2AfterDeposit.deposit,
      total: supir2Net,
    },
    bbm: {
      fuel_type: fuelConfig.fuelType,
      formula: fuelConfig.formulaLabel,
      consumption_km_per_liter: fuelConfig.kmPerLiter,
      price_per_liter: fuelConfig.pricePerLiter,
      total: bbmTotal,
    },
    grand_total_operational: grandTotal,
    notes,
  };
}
