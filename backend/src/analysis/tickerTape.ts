import { getDailySeries } from '../data/transactions.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';
import { mapWithConcurrency } from '../data/slug.js';

// Scrolling ticker strip under the header (design mockup reference) — a
// fixed, small watchlist of well-known blue chips, each priced from E-03
// daily transaction data (1 credit/call, cached 24h) rather than fabricated.
const TICKER_SYMBOLS = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'ICBP', 'ADRO'];

export interface TickerTapeRow {
  symbol: string;
  price: number | null;
  change: number | null;
}

async function getTickerRow(symbol: string): Promise<TickerTapeRow> {
  try {
    const { bars } = await getDailySeries(symbol, { start: daysAgoIso(7), end: todayIso() });
    if (bars.length === 0) return { symbol, price: null, change: null };
    const last = bars[bars.length - 1];
    const prev = bars.length > 1 ? bars[bars.length - 2] : undefined;
    const change = prev && prev.close ? (last.close - prev.close) / prev.close : null;
    return { symbol, price: last.close, change };
  } catch {
    return { symbol, price: null, change: null };
  }
}

export async function getTickerTape(): Promise<TickerTapeRow[]> {
  return mapWithConcurrency(TICKER_SYMBOLS, 4, getTickerRow);
}
