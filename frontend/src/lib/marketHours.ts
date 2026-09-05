// Real IDX trading-hours check (WIB/Asia-Jakarta), computed client-side from
// the viewer's own clock — not a live feed, so this can never claim
// "real-time" data, only whether the exchange is scheduled to be open right
// now. Approximate session times (regular market, excludes special sessions
// like Ramadan-shortened hours or holidays, which we have no calendar for).
export interface MarketStatus {
  open: boolean;
  label: string;
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const minutesNow = hour * 60 + minute;

  const isWeekday = !['Sat', 'Sun'].includes(weekday);
  const session1 = minutesNow >= 9 * 60 && minutesNow < 11 * 60 + 30;
  const session2 = minutesNow >= 13 * 60 + 30 && minutesNow < 15 * 60;

  if (isWeekday && session1) return { open: true, label: 'Pasar Buka · Sesi 1' };
  if (isWeekday && session2) return { open: true, label: 'Pasar Buka · Sesi 2' };
  return { open: false, label: 'Pasar Tutup' };
}
