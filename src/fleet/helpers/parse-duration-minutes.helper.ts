/** Parse durasi teks "2 jam 3 menit" / "41 menit" → total menit */
export function parseDurationToMinutes(text: string): number | null {
  if (!text?.trim()) return null;
  const s = text.toLowerCase();
  let total = 0;

  const jamMatch = s.match(/(\d+)\s*jam/);
  if (jamMatch) total += parseInt(jamMatch[1], 10) * 60;

  const menitMatch = s.match(/(\d+)\s*menit/);
  if (menitMatch) total += parseInt(menitMatch[1], 10);

  if (!jamMatch && !menitMatch) {
    const hMatch = s.match(/(\d+)\s*h/);
    const mMatch = s.match(/(\d+)\s*m/);
    if (hMatch) total += parseInt(hMatch[1], 10) * 60;
    if (mMatch) total += parseInt(mMatch[1], 10);
  }

  return total > 0 ? total : null;
}

/** Jumlahkan durasi beberapa segment (menit) */
export function sumSegmentDurations(durationTexts: string[]): number {
  return durationTexts.reduce((sum, t) => sum + (parseDurationToMinutes(t) ?? 0), 0);
}

export function formatMinutesToDuration(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)} menit`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return minutes > 0 ? `${hours} jam ${minutes} menit` : `${hours} jam`;
}
