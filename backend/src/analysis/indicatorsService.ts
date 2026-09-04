import { getDailySeries } from '../data/transactions.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';
import { computeIndicators, type IndicatorResult } from './indicators.js';

export async function getIndicators(symbol: string): Promise<IndicatorResult> {
  // Same 90-day window as F-06/F-07 — hits their cached call, no new credits.
  const series = await getDailySeries(symbol, { start: daysAgoIso(90), end: todayIso() });
  return computeIndicators(symbol, series.bars);
}
