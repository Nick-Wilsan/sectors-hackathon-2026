import { getIndexDaily } from '../data/market.js';
import { recentRange } from '../data/dateRange.js';
import type { DailyBar } from '../data/types.js';

// Market-relative context for F-06.
//
// The anomaly detector answers "did this emiten move unusually far?" but not
// "was the whole market moving too?" — and that gap is exactly where users
// start inventing causes ("the president spoke", "MSCI rebalanced"). This
// module answers the market-wide half of that question with a measurement
// instead of a narrative: it never names an event, it only separates the part
// of a day's move that the whole index shared from the part that did not.
//
// Deliberately NOT a causal claim. "IHSG also fell 3% that day" is an
// observation about two series; it is not a statement that one caused the
// other, and no string produced here says otherwise.
//
// Credit cost: zero. The IHSG series requested here is byte-for-byte the same
// URL the dashboard already fetches (`/v2/index-daily/ihsg/?start=<week
// anchor>`), so it is always served from the file cache. Changing the window
// or the index code would mint a new cache key and start costing a credit.
const INDEX_CODE = 'ihsg';
const INDEX_WINDOW_DAYS = 90;

/** Below this daily move the split is meaningless — dividing a 0.05% move into
 *  "market" and "own" parts produces ratios that swing wildly on rounding. */
const FLAT_MOVE_THRESHOLD = 0.005; // 0.5%

/** Share of the emiten's move that IHSG also made, above which the day reads
 *  as a market-wide session rather than something specific to the emiten. */
const MARKET_WIDE_SHARE = 0.5;
const MIXED_SHARE = 0.2;

/** Sensitivity is a 90-day regression slope; fewer overlapping days than this
 *  and it is noise dressed as a coefficient. */
const MIN_SENSITIVITY_DAYS = 30;

export type MoveOrigin = 'market-wide' | 'mixed' | 'idiosyncratic' | 'flat';

export interface MarketRelativeMove {
  /** Trading date this comparison describes — the emiten's latest bar. */
  date: string;
  indexCode: string;
  indexLabel: string;
  /** Close-over-close return of the emiten on `date`. */
  stockReturn: number;
  /** Close-over-close return of IHSG on the same date. */
  marketReturn: number;
  /** stockReturn - marketReturn, in decimal (0.0126 = 1.26 percentage points). */
  excessReturn: number;
  /** Typical multiple of IHSG's daily move this emiten made over the window.
   *  Descriptive only — null when the overlap is too short to be meaningful. */
  sensitivity: number | null;
  sensitivityDays: number;
  origin: MoveOrigin;
  /** Plain-language statement of the measurement. Never names a cause. */
  statement: string;
}

function returnsByDate(points: { date: string; value: number }[]): Map<string, number> {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const out = new Map<string, number>();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].value;
    if (prev > 0) out.set(sorted[i].date, (sorted[i].value - prev) / prev);
  }
  return out;
}

/**
 * Ordinary-least-squares slope of stock returns on index returns, over the
 * days both series traded. This is the standard "how much does this name
 * amplify the index" figure; it is reported as context, not used to classify.
 */
function sensitivityOf(stock: Map<string, number>, index: Map<string, number>): { value: number | null; days: number } {
  const pairs: [number, number][] = [];
  for (const [date, s] of stock) {
    const m = index.get(date);
    if (m !== undefined) pairs.push([m, s]);
  }
  if (pairs.length < MIN_SENSITIVITY_DAYS) return { value: null, days: pairs.length };

  const meanM = pairs.reduce((a, [m]) => a + m, 0) / pairs.length;
  const meanS = pairs.reduce((a, [, s]) => a + s, 0) / pairs.length;
  let cov = 0;
  let varM = 0;
  for (const [m, s] of pairs) {
    cov += (m - meanM) * (s - meanS);
    varM += (m - meanM) ** 2;
  }
  if (varM === 0) return { value: null, days: pairs.length };
  return { value: cov / varM, days: pairs.length };
}

function pct(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

function pp(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)} poin persen`;
}

function classify(stockReturn: number, marketReturn: number): MoveOrigin {
  if (Math.abs(stockReturn) < FLAT_MOVE_THRESHOLD) return 'flat';
  const share = marketReturn / stockReturn; // negative when the two moved opposite ways
  if (share >= MARKET_WIDE_SHARE) return 'market-wide';
  if (share >= MIXED_SHARE) return 'mixed';
  return 'idiosyncratic';
}

function statementFor(origin: MoveOrigin, stockReturn: number, marketReturn: number, excess: number): string {
  switch (origin) {
    case 'flat':
      return `Harga emiten ini hampir tidak bergerak (${pct(stockReturn)}) sementara IHSG ${pct(marketReturn)}. Selisih sekecil ini tidak dipilah lebih jauh.`;
    case 'market-wide':
      return `IHSG bergerak ${pct(marketReturn)} pada hari yang sama, searah dengan emiten ini (${pct(stockReturn)}). Sebagian besar pergerakan hari itu terjadi di seluruh bursa, bukan hanya di emiten ini.`;
    case 'mixed':
      return `IHSG bergerak ${pct(marketReturn)} dan emiten ini ${pct(stockReturn)}. Sebagian searah pasar, sisanya ${pp(excess)} adalah selisih terhadap pasar.`;
    case 'idiosyncratic':
      return `IHSG hanya bergerak ${pct(marketReturn)} pada hari yang sama, sementara emiten ini ${pct(stockReturn)} — selisih ${pp(excess)}. Pergerakan ini tidak terjadi di seluruh bursa.`;
  }
}

/**
 * Compares an emiten's latest daily move against IHSG's move on the same date.
 * Returns null when the date has no matching index bar (suspended trading,
 * first day of a listing, index data not yet published for that session).
 */
export async function getMarketRelativeMove(bars: DailyBar[]): Promise<MarketRelativeMove | null> {
  const index = await getIndexDaily(INDEX_CODE, recentRange(INDEX_WINDOW_DAYS));
  return buildMarketRelativeMove(bars, index);
}

/** Pure half of {@link getMarketRelativeMove}, so a caller that already holds
 *  the index series (the market-wide scan) can reuse it without refetching. */
export function buildMarketRelativeMove(bars: DailyBar[], index: { date: string; price: number }[]): MarketRelativeMove | null {
  const stockReturns = returnsByDate(bars.map((b) => ({ date: b.date, value: b.close })));
  const indexReturns = returnsByDate(index.map((p) => ({ date: p.date, value: p.price })));

  const sortedDates = [...stockReturns.keys()].sort();
  const date = sortedDates[sortedDates.length - 1];
  if (!date) return null;

  const stockReturn = stockReturns.get(date);
  const marketReturn = indexReturns.get(date);
  // No index bar for that session — reporting a comparison against a missing
  // day would be worse than reporting nothing.
  if (stockReturn === undefined || marketReturn === undefined) return null;

  const excessReturn = stockReturn - marketReturn;
  const origin = classify(stockReturn, marketReturn);
  const sensitivity = sensitivityOf(stockReturns, indexReturns);

  return {
    date,
    indexCode: INDEX_CODE,
    indexLabel: 'IHSG',
    stockReturn,
    marketReturn,
    excessReturn,
    sensitivity: sensitivity.value,
    sensitivityDays: sensitivity.days,
    origin,
    statement: statementFor(origin, stockReturn, marketReturn, excessReturn),
  };
}

/** Shared by the emiten panel and the market scan so both show the same caveat. */
export const MARKET_CONTEXT_DISCLAIMER =
  'Perbandingan ini hanya memisahkan pergerakan yang juga terjadi di seluruh bursa dari yang tidak. Ia tidak menyatakan peristiwa apa yang terjadi maupun apa penyebabnya.';

export { INDEX_WINDOW_DAYS, MIN_SENSITIVITY_DAYS };
