import { sectorsGet } from './sectorsClient.js';
import { DAILY_TTL_MS } from './cache.js';
import type { DailyBar, DailySeries } from './types.js';

interface RawDailyItem {
  symbol: string;
  date: string;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number;
  market_cap: number;
}

export interface GetDailySeriesParams {
  /** YYYY-MM-DD. Defaults to 30 days before `end`. */
  start?: string;
  /** YYYY-MM-DD. Defaults to today. */
  end?: string;
}

/**
 * E-03: Daily Transaction Data (1 credit per call).
 * The API clamps any requested window to the most recent 90 days — pass a
 * `start` more than 90 days before `end` and you'll silently get fewer rows.
 */
export async function getDailySeries(
  symbol: string,
  params: GetDailySeriesParams = {},
  cacheTtlMs: number = DAILY_TTL_MS,
): Promise<DailySeries> {
  const raw = await sectorsGet<RawDailyItem[]>(`/v2/daily/${encodeURIComponent(symbol)}/`, {
    params: { start: params.start, end: params.end },
    // Prices move daily. Under the 30-day default an emiten page kept showing
    // Monday's close all week while the IHSG chart beside it was current.
    // Callers that only need history (not the latest bar) may accept older data.
    cacheTtlMs,
  });

  const bars: DailyBar[] = raw.map((item) => ({
    symbol: item.symbol,
    date: item.date,
    close: item.close,
    open: item.open,
    high: item.high,
    low: item.low,
    volume: item.volume,
    marketCap: item.market_cap,
  }));

  return { symbol, bars, fetchedAt: new Date().toISOString() };
}
