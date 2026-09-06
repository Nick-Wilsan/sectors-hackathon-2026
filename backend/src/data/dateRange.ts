// Date ranges for Sectors queries.
//
// Sectors charges per distinct URL and the cache is keyed on the full URL, so a
// range built from "today" mints a new key every calendar day: opening the same
// emiten page on a new day re-spent a credit on prices no matter how long the
// cache TTL was. Two changes fix that:
//
//   1. `end` is never sent. Verified 5 Sep 2026 against /v2/daily, /v2/index-daily
//      and /v2/idx-total: with only `start`, all three return the NEWEST bars
//      through the latest trading day (62 bars for the 90-day window). Sending
//      today's date as `end` bought nothing and churned the cache key daily.
//   2. `start` is snapped to the start of the week, so the remaining URL changes
//      once a week instead of once a day.
//
// Net effect: one refresh per query per week rather than per day, and the data
// that comes back is current to the day it was fetched.
const WEEK_STARTS_MONDAY = true;

/** Local-time ISO date (YYYY-MM-DD). Deliberately not toISOString(), which
 *  reports the UTC day and so rolls over seven hours early for WIB users. */
function isoLocal(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Most recent week boundary at or before today, in local time. */
function anchorDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const offset = WEEK_STARTS_MONDAY ? (d.getDay() + 6) % 7 : d.getDay();
  d.setDate(d.getDate() - offset);
  return d;
}

/** Start of a lookback window, snapped to the weekly anchor. */
export function daysAgoIso(days: number): string {
  const d = anchorDate();
  d.setDate(d.getDate() - days);
  return isoLocal(d);
}

/**
 * Params for "the last N days of data", for any Sectors endpoint that takes
 * start/end. Omits `end` on purpose — see the note at the top of this file.
 * Use this instead of building `{ start, end }` by hand so no call site
 * reintroduces a URL that changes daily.
 */
export function recentRange(days: number): { start: string } {
  return { start: daysAgoIso(days) };
}
