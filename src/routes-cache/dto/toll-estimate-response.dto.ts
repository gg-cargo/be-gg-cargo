export class TollEstimatedPriceDto {
  currency_code: string;
  amount: number;
  formatted: string;
}

export class TollRouteLegDto {
  jarak_km: number;
  estimasi_waktu: string;
  durasi_menit: number;
}

export class TollEstimateDataDto {
  origin: string;
  destination: string;
  /** google | mapbox | cache */
  source: string;
  via_tol: TollRouteLegDto & {
    /** Golongan tol truk (default V) */
    golongan_tol: number;
    /** Pengali dari harga mobil Google (default 2) */
    multiplier_golongan_v: number;
    /** Harga tol mobil penumpang dari Google (sebelum pengali) */
    biaya_tol_mobil_idr: number | null;
    biaya_tol_mobil: string | null;
    /** Harga tol Golongan V truk (= mobil × multiplier) */
    biaya_tol_idr: number | null;
    biaya_tol_amount: number | null;
    biaya_tol_currency: string | null;
    biaya_tol: string | null;
    /** Estimasi mobil dari Google */
    estimasi_harga_tol_mobil: TollEstimatedPriceDto[];
    /** Estimasi Golongan V (= estimasi mobil × multiplier) */
    estimasi_harga_tol: TollEstimatedPriceDto[];
  };
  non_tol: TollRouteLegDto;
  selisih_jarak_km: number;
  google_quota_hari_ini: number;
  /** Diisi jika Google gagal dan fallback ke Mapbox */
  google_error?: string;
  /** Kartu tol yang dipakai (dari env GOOGLE_ROUTES_TOLL_PASSES) */
  toll_passes_used?: string[];
}

export class TollEstimateResponseDto {
  success: boolean;
  message: string;
  data: TollEstimateDataDto;
}
