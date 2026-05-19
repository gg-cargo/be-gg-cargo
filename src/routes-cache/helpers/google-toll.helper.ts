/** Harga tol dari Google Routes API (Money proto) */
export interface GoogleTollMoneyDto {
  currencyCode: string;
  units: string;
  nanos?: number;
}

export interface ParsedTollPrice {
  amount: number;
  currencyCode: string;
}

/** Parse durasi Google format "5382s" → menit */
export function parseGoogleDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const seconds = parseInt(String(duration).replace(/s$/i, ''), 10);
  return Number.isFinite(seconds) ? seconds / 60 : 0;
}

/** Konversi estimatedPrice Google ke nilai numerik */
export function parseGoogleMoney(money: GoogleTollMoneyDto): number {
  const units = Number(money.units || 0);
  const nanos = Number(money.nanos || 0) / 1e9;
  return Math.round(units + nanos);
}

/**
 * Ambil harga tol terbaik: prioritas IDR, lalu harga terendah jika multi-pass.
 * Sesuai docs: jika lebih dari satu pass, Google mengembalikan yang termurah.
 */
export function pickTollEstimatedPrice(
  prices: GoogleTollMoneyDto[] | undefined,
): ParsedTollPrice | null {
  if (!Array.isArray(prices) || prices.length === 0) return null;

  const idr = prices.find((p) => p.currencyCode === 'IDR');
  if (idr) {
    return { amount: parseGoogleMoney(idr), currencyCode: 'IDR' };
  }

  const parsed = prices.map((p) => ({
    amount: parseGoogleMoney(p),
    currencyCode: p.currencyCode,
  }));
  parsed.sort((a, b) => a.amount - b.amount);
  return parsed[0] ?? null;
}

export function parseTollPassesFromEnv(raw?: string): string[] {
  const value = raw?.trim() || 'ID_E_TOLL';
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Golongan tol truk besar (Jasa Marga) */
export const GOLONGAN_TOL_TRUK = 5;

/** Pengali estimasi Google (mobil) → Golongan V truk */
export const DEFAULT_GOLONGAN_V_TOLL_MULTIPLIER = 2;

export function getGolonganVTollMultiplier(): number {
  const raw = process.env.GOOGLE_ROUTES_GOLONGAN_V_MULTIPLIER?.trim();
  if (!raw) return DEFAULT_GOLONGAN_V_TOLL_MULTIPLIER;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOLONGAN_V_TOLL_MULTIPLIER;
}

/** Terapkan pengali Golongan V (default 2× harga mobil dari Google). */
export function applyGolonganVToll(
  amount: number | null | undefined,
  multiplier = getGolonganVTollMultiplier(),
): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  return Math.round(amount * multiplier);
}
