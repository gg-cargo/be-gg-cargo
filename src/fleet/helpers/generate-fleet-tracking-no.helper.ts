/** Prefix nomor tracking fleet trip, contoh: GG260519001 */
export const FLEET_TRIP_TRACKING_PREFIX = 'GG';

export function formatFleetTrackingDateKey(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function buildFleetTrackingNo(date: Date, seq: number): string {
  return `${FLEET_TRIP_TRACKING_PREFIX}${formatFleetTrackingDateKey(date)}${String(seq).padStart(3, '0')}`;
}

export function fleetTrackingNoPrefixForDate(date: Date): string {
  return `${FLEET_TRIP_TRACKING_PREFIX}${formatFleetTrackingDateKey(date)}`;
}
