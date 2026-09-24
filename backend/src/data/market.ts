import { sectorsGet } from './sectorsClient.js';
import { DAILY_TTL_MS as MARKET_TTL_MS } from './cache.js';

// Market-wide overview data (landing page): IHSG index chart, total IDX
// market cap, and today's top gainers/losers. Not tied to any single emiten.

export interface IndexPoint {
  date: string;
  price: number;
}

interface RawIndexDailyItem {
  index_code: string;
  date: string;
  price: number;
}

export async function getIndexDaily(indexCode: string, params: { start?: string; end?: string } = {}): Promise<IndexPoint[]> {
  const raw = await sectorsGet<RawIndexDailyItem[]>(`/v2/index-daily/${indexCode}/`, {
    params: { start: params.start, end: params.end },
    cacheTtlMs: MARKET_TTL_MS,
  });
  return raw.map((item) => ({ date: item.date, price: item.price }));
}

export interface IdxTotalPoint {
  date: string;
  marketCap: number;
}

interface RawIdxTotalItem {
  date: string;
  idx_total_market_cap: number;
}

export async function getIdxTotal(params: { start?: string; end?: string } = {}): Promise<IdxTotalPoint[]> {
  const raw = await sectorsGet<RawIdxTotalItem[]>('/v2/idx-total/', {
    params: { start: params.start, end: params.end },
    cacheTtlMs: MARKET_TTL_MS,
  });
  return raw.map((item) => ({ date: item.date, marketCap: item.idx_total_market_cap }));
}

export interface MoverRow {
  symbol: string;
  companyName: string;
  priceChange: number;
  lastClosePrice: number;
  latestCloseDate: string;
}

interface RawMoverRow {
  name: string;
  symbol: string;
  price_change: number;
  last_close_price: number;
  latest_close_date: string;
}

interface RawTopChangesResponse {
  top_gainers: Record<string, RawMoverRow[]>;
  top_losers: Record<string, RawMoverRow[]>;
}

export interface TopMovers {
  gainers: MoverRow[];
  losers: MoverRow[];
}

function toMoverRow(r: RawMoverRow): MoverRow {
  return { symbol: r.symbol, companyName: r.name, priceChange: r.price_change, lastClosePrice: r.last_close_price, latestCloseDate: r.latest_close_date };
}

/** Today's (1d) top gainers/losers — 2 credits (1 per classification), cached 24h. */
export async function getTopMoversToday(nStock = 8): Promise<TopMovers> {
  const raw = await sectorsGet<RawTopChangesResponse>('/v2/companies/top-changes/', {
    params: { classifications: 'top_gainers,top_losers', periods: '1d', n_stock: nStock },
    cacheTtlMs: MARKET_TTL_MS,
  });
  return {
    gainers: (raw.top_gainers['1d'] ?? []).map(toMoverRow),
    losers: (raw.top_losers['1d'] ?? []).map(toMoverRow),
  };
}

export interface MostTradedRow {
  symbol: string;
  companyName: string;
  volume: number;
  price: number;
  /**
   * Close-over-close change against the immediately preceding trading day,
   * or null when that day's price for this symbol isn't in the response.
   * Deliberately not filled from an older date in the window: the symbol
   * only appears on days it made the most-traded list, so a gap would make
   * this a multi-day change wearing a daily label.
   */
  priceChange: number | null;
}

interface RawMostTradedRow {
  symbol: string;
  company_name: string;
  volume: number;
  price: number;
}

/** Most actively traded stocks by volume, most recent day — 2 credits, cached 24h. */
export async function getMostTradedToday(nStock = 8): Promise<MostTradedRow[]> {
  const raw = await sectorsGet<Record<string, RawMostTradedRow[]>>('/v2/most-traded/', {
    params: { n_stock: nStock },
    cacheTtlMs: MARKET_TTL_MS,
  });
  const dates = Object.keys(raw).sort();
  const latestDate = dates[dates.length - 1];
  const rows = latestDate ? raw[latestDate] : [];

  // The endpoint returns a whole window of days, not just the latest one, so
  // the previous session's close for these symbols is already in hand — no
  // extra request and no extra credit to turn it into a daily change.
  const previousDate = dates[dates.length - 2];
  const previousPrice = new Map<string, number>();
  for (const r of previousDate ? raw[previousDate] : []) previousPrice.set(r.symbol, r.price);

  return rows.map((r) => {
    const prev = previousPrice.get(r.symbol);
    return {
      symbol: r.symbol,
      companyName: r.company_name,
      volume: r.volume,
      price: r.price,
      priceChange: prev ? (r.price - prev) / prev : null,
    };
  });
}

/** Multiple indices in one shot — 1 credit each, cached 24h. Powers the Sectors.app-style index chip row. */
export async function getMultipleIndices(codes: string[]): Promise<Record<string, IndexPoint[]>> {
  const entries = await Promise.all(
    codes.map(async (code) => {
      try {
        return [code, await getIndexDaily(code)] as const;
      } catch {
        return [code, []] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
