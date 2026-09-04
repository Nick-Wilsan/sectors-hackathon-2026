import { getDailySeries } from '../data/transactions.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';
import { detectCandlestickPatterns, type CandlestickResult } from './candlestick.js';

export async function getCandlestickPatterns(symbol: string): Promise<CandlestickResult> {
  // Same 90-day max window as F-06 — reuses the identical cached call when
  // both features are viewed for the same emiten (Technical Spec 5.5).
  const series = await getDailySeries(symbol, { start: daysAgoIso(90), end: todayIso() });
  return detectCandlestickPatterns(symbol, series.bars);
}
