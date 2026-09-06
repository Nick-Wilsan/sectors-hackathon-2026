import { getMostTradedToday, getIndexDaily } from '../data/market.js';
import { getDailySeries } from '../data/transactions.js';
import { recentRange } from '../data/dateRange.js';
import { mapWithConcurrency } from '../data/slug.js';
import { detectAnomaly, type AnomalyMetric } from './anomaly.js';
import {
  buildMarketRelativeMove,
  MARKET_CONTEXT_DISCLAIMER,
  INDEX_WINDOW_DAYS,
  type MarketRelativeMove,
} from './marketContext.js';

export interface MarketAnomalyRow {
  symbol: string;
  companyName: string;
  status: 'ok' | 'inadequate';
  date: string | null;
  hasAnomaly: boolean;
  /** Only the metrics that actually breached the threshold, for compact display. */
  triggered: AnomalyMetric[];
  /** Same-day move split against IHSG; null when the index has no bar for that date. */
  marketContext: MarketRelativeMove | null;
}

export interface MarketAnomalyScan {
  scannedAt: string;
  threshold: number;
  rows: MarketAnomalyRow[];
  /** Index return on the scanned session, so the strip can state it once. */
  marketReturn: number | null;
  marketContextDisclaimer: string;
}

/**
 * Runs F-06's per-emiten anomaly detector across the day's most-traded names,
 * answering a question the raw volume table cannot: is today's activity
 * genuinely unusual *for that emiten*, or just normal for a heavily traded one?
 *
 * Credit cost is deliberately bounded: one daily-series call per symbol
 * (1 credit each, cached per week), and no news lookup — the per-emiten page
 * still does that when a user drills into a specific anomaly. SCAN_LIMIT is
 * the knob; raising it raises credit burn one-for-one, which is why the scan
 * covers the most-traded list rather than all ~900 listed emiten (that would
 * cost ~900 credits per refresh — several times the whole project budget).
 *
 * SCAN_LIMIT is capped at the most-traded response we already pay for, so
 * scanning the full list adds daily-series calls but no extra list call.
 */
const SCAN_LIMIT = 8;

export async function getMarketAnomalyScan(): Promise<MarketAnomalyScan> {
  // Fetched once for the whole strip rather than per row. Same URL as the
  // dashboard's IHSG chart, so this is a cache hit and costs nothing.
  const [mostTradedAll, index] = await Promise.all([
    getMostTradedToday(8),
    getIndexDaily('ihsg', recentRange(INDEX_WINDOW_DAYS)).catch(() => [] as { date: string; price: number }[]),
  ]);
  const mostTraded = mostTradedAll.slice(0, SCAN_LIMIT);

  const rows = await mapWithConcurrency(mostTraded, 3, async (row): Promise<MarketAnomalyRow> => {
    try {
      const series = await getDailySeries(row.symbol, recentRange(90));
      const anomaly = detectAnomaly(row.symbol, series.bars);
      return {
        symbol: row.symbol,
        companyName: row.companyName,
        status: anomaly.status,
        date: anomaly.date,
        hasAnomaly: anomaly.hasAnomaly,
        triggered: anomaly.metrics.filter((m) => m.isAnomaly),
        marketContext: index.length > 0 ? buildMarketRelativeMove(series.bars, index) : null,
      };
    } catch {
      // One unavailable series must not blank the whole strip.
      return {
        symbol: row.symbol,
        companyName: row.companyName,
        status: 'inadequate',
        date: null,
        hasAnomaly: false,
        triggered: [],
        marketContext: null,
      };
    }
  });

  // The index moved the same amount for every row; taking it from whichever
  // row has it avoids restating the same number eight times in the UI.
  const marketReturn = rows.find((r) => r.marketContext)?.marketContext?.marketReturn ?? null;

  return {
    scannedAt: new Date().toISOString(),
    threshold: 2,
    rows,
    marketReturn,
    marketContextDisclaimer: MARKET_CONTEXT_DISCLAIMER,
  };
}
