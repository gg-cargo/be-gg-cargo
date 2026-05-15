/** Batas tier jarak (km) untuk upah supir */
export const FLEET_ESTIMATE_TIER_LOW_MAX_KM = 300;
export const FLEET_ESTIMATE_TIER_MID_MAX_KM = 800;

/** Upah supir 1 (IDR per km) */
export const FLEET_ESTIMATE_DRIVER_1_RATES = {
  below_300: 1500,
  from_300_to_800: 2100,
  above_800: 1850,
} as const;

/** Upah supir 2 (IDR per km) — hanya jika jarak efektif > 300 km */
export const FLEET_ESTIMATE_DRIVER_2_RATES = {
  from_300_to_800: 400,
  above_800: 350,
} as const;

export const FLEET_ESTIMATE_DRIVER_2_MIN_KM = 300;

/** Konfigurasi BBM per tipe kendaraan */
export const FLEET_ESTIMATE_FUEL_CONFIG = {
  CDDL: {
    kmPerLiter: 6,
    pricePerLiter: 6800,
    fuelType: 'Solar',
    formulaLabel: '(jarak_km / 6) × 6800',
  },
  TRAGA: {
    kmPerLiter: 12,
    pricePerLiter: 6800,
    fuelType: 'Solar',
    formulaLabel: '(jarak_km / 12) × 6800',
  },
  CARRY: {
    kmPerLiter: 12,
    pricePerLiter: 10000,
    fuelType: 'Pertalite',
    formulaLabel: '(jarak_km / 12) × 10000',
  },
} as const;

export type FleetEstimateVehicleType = keyof typeof FLEET_ESTIMATE_FUEL_CONFIG;

export type FleetEstimateDriverTier =
  | 'below_300'
  | 'from_300_to_800'
  | 'above_800';
