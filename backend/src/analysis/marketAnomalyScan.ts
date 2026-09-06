import { getMostTradedToday } from '../data/market.js';
import { getDailySeries } from '../data/transactions.js';
import { recentRange } from '../data/dateRange.js';
import { mapWithConcurrency } from '../data/slug.js';
import { detectAnomaly, type AnomalyMetric } from './anomaly.js';

export interface MarketAnomalyRow {
  symbol: string;
  companyName: string;
  status: 'ok' | 'inadequate';
  date: string | null;
  hasAnomaly: boolean;
  /** Only the metrics that actually breached the threshold, for compact display. */
  triggered: AnomalyMetric[];
}

export interface MarketAnomalyScan {
  scannedAt: string;
  threshold: number;
  rows: MarketAnomalyRow[];
}

/**
 * Runs F-06's per-emiten anomaly detector across the day's most-traded names,
 * answering a question the raw volume table cannot: is today's activity
 * genuinely unusual *for that emiten*, or just normal for a heavily traded one?
 *
 * Credit cost is deliberately bounded: one daily-series call per symbol
 * (1 credit each, 24h file cache), and no news lookup — the per-emiten page
 * still does that when a user drills into a specific anomaly. SCAN_LIMIT is
 * the knob; raising it raises daily credit burn one-for-one.
 */
const SCAN_LIMIT = 5;

export async function getMarketAnomalyScan(): Promise<MarketAnomalyScan> {
  const mostTraded = (await getMostTradedToday(8)).slice(0, SCAN_LIMIT);

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
      };
    } catch {
      // One unavailable series must not blank the whole strip.
      return { symbol: row.symbol, companyName: row.companyName, status: 'inadequate', date: null, hasAnomaly: false, triggered: [] };
    }
  });

  return { scannedAt: new Date().toISOString(), threshold: 2, rows };
}
