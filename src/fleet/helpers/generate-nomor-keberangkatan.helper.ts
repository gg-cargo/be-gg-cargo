/** Prefix nomor keberangkatan fleet estimate, contoh: KBR260516001 */
export const FLEET_ESTIMATE_NOMOR_KEBERANGKATAN_PREFIX = 'KBR';

export function formatNomorKeberangkatanDateKey(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function buildNomorKeberangkatan(date: Date, seq: number): string {
  const dateKey = formatNomorKeberangkatanDateKey(date);
  return `${FLEET_ESTIMATE_NOMOR_KEBERANGKATAN_PREFIX}${dateKey}${String(seq).padStart(3, '0')}`;
}

export function nomorKeberangkatanPrefixForDate(date: Date): string {
  return `${FLEET_ESTIMATE_NOMOR_KEBERANGKATAN_PREFIX}${formatNomorKeberangkatanDateKey(date)}`;
}
