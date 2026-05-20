import {
  FLEET_ESTIMATE_DRIVER_1_FLAT_BELOW_300,
  FLEET_ESTIMATE_DRIVER_1_RATES,
  FLEET_ESTIMATE_DRIVER_2_MIN_KM,
  FLEET_ESTIMATE_DRIVER_2_RATES,
  FLEET_ESTIMATE_FUEL_CONFIG,
  FLEET_ESTIMATE_TIER_LOW_MAX_KM,
  FLEET_ESTIMATE_TIER_MID_MAX_KM,
  FleetEstimateDriverTier,
  FleetEstimateVehicleType,
} from './constants/fleet-estimate.constants';
import { FleetEstimateDto, FleetEstimateTripType } from './dto/fleet-estimate.dto';

export interface FleetEstimateDriverLine {
  rate_per_km: number;
  tier: FleetEstimateDriverTier | null;
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
  const supir1Total = d1.total;

  const d2 = resolveDriver2Tier(effectiveKm);
  const supir2Eligible = effectiveKm > FLEET_ESTIMATE_DRIVER_2_MIN_KM;
  const supir2Total = supir2Eligible ? Math.round(effectiveKm * d2.ratePerKm) : 0;

  const bbmTotal = Math.round((effectiveKm / fuelConfig.kmPerLiter) * fuelConfig.pricePerLiter);

  const grandTotal = supir1Total + supir2Total + bbmTotal;

  const notes: string[] = [
    'Perhitungan biaya operasional (supir + BBM). Belum termasuk tol, feri, dan uang makan.',
    `Jarak efektif: ${effectiveKm} km (${dto.trip_type === FleetEstimateTripType.TWO_WAY ? 'pulang-pergi' : 'satu arah'}).`,
  ];
  if (dto.road_type === 'manual') {
    notes.push('Jarak dari input manual; pastikan sesuai hasil peta.');
  }
  if (d1.tier === 'below_300') {
    notes.push(
      `Upah supir 1: flat Rp ${FLEET_ESTIMATE_DRIVER_1_FLAT_BELOW_300.toLocaleString('id-ID')} (jarak < ${FLEET_ESTIMATE_TIER_LOW_MAX_KM} km) + BBM.`,
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
      total: supir1Total,
    },
    supir_2: {
      eligible: supir2Eligible,
      rate_per_km: d2.ratePerKm,
      tier: d2.tier,
      total: supir2Total,
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
