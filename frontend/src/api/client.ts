import type { AnomalyResult, CandlestickResult, CompanyLite, CompositeScoreResult, DailySeries, FrameworkResult, FundamentalExtras, IndicatorResult, MarketOverview, MarketSorotan, NewsResult, PatternSimilarityResult, PeerComparisonResult, ScreenerResult, SubsectorOption, MarketAnomalyScan, NewsIndexResult, GlossaryResult } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getSubsectors(): Promise<SubsectorOption[]> {
  return getJson('/subsectors');
}

export function getMarketOverview(): Promise<MarketOverview> {
  return getJson('/market/overview');
}

export function getMarketSorotan(): Promise<MarketSorotan> {
  return getJson('/market/sorotan');
}

export function getAllCompanies(): Promise<CompanyLite[]> {
  return getJson('/companies');
}

export function getMarketNews(limit = 15, offset?: number): Promise<NewsResult> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (offset !== undefined) params.set('offset', String(offset));
  return getJson(`/market/news?${params.toString()}`);
}

/** Full /berita index: one fetched corpus plus every facet, filtered client-side. */
/** Kamus istilah untuk tooltip glosarium. Tidak memanggil Sectors — 0 kredit. */
export function getGlosarium(): Promise<GlossaryResult> {
  return getJson('/market/glosarium');
}

export function getNewsIndex(): Promise<NewsIndexResult> {
  return getJson('/market/berita');
}

export function getCompositeScore(symbol: string): Promise<CompositeScoreResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/skor`);
}

export function getPeerComparison(symbol: string, limit?: number): Promise<PeerComparisonResult> {
  const query = limit !== undefined ? `?limit=${limit}` : '';
  return getJson(`/emiten/${encodeURIComponent(symbol)}/peer${query}`);
}

export function getFundamentalExtras(symbol: string): Promise<FundamentalExtras> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/tambahan`);
}

export function getFramework(symbol: string): Promise<FrameworkResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/framework`);
}

export function getAnomaly(symbol: string): Promise<AnomalyResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/anomali`);
}

export function getDailyPrices(symbol: string): Promise<DailySeries> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/harga`);
}

export function getCandlestickPatterns(symbol: string): Promise<CandlestickResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/pola`);
}

export function getIndicators(symbol: string): Promise<IndicatorResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/indikator`);
}

export function getPatternSimilarity(symbol: string): Promise<PatternSimilarityResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/kemiripan`);
}

export async function askAboutEmiten(symbol: string, question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/emiten/${encodeURIComponent(symbol)}/tanya`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.answer;
}

/** Batas bawah/atas untuk nilai MENTAH sebuah komponen skor (bukan persentilnya). */
export interface ComponentRange {
  min?: number;
  max?: number;
}

export interface ScreenerQuery {
  subSector: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  minScore?: number;
  maxScore?: number;
  /** Kunci memakai nama komponen: roe, netProfitMargin, der, ocfMargin, roa. */
  componentFilters?: Record<string, ComponentRange>;
  limit?: number;
}

export function screenCompanies(query: ScreenerQuery): Promise<ScreenerResult> {
  const params = new URLSearchParams();
  params.set('subSector', query.subSector);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDirection) params.set('sortDirection', query.sortDirection);
  if (query.minScore !== undefined) params.set('minScore', String(query.minScore));
  if (query.maxScore !== undefined) params.set('maxScore', String(query.maxScore));
  if (query.limit !== undefined) params.set('limit', String(query.limit));

  // Backend membaca tiap komponen sebagai minRoe/maxRoe, minDer/maxDer, dan
  // seterusnya — huruf pertama kunci dikapitalkan.
  for (const [key, range] of Object.entries(query.componentFilters ?? {})) {
    const suffix = key.charAt(0).toUpperCase() + key.slice(1);
    if (range.min !== undefined) params.set(`min${suffix}`, String(range.min));
    if (range.max !== undefined) params.set(`max${suffix}`, String(range.max));
  }
  return getJson(`/screener?${params.toString()}`);
}

export function getMarketAnomalyScan(): Promise<MarketAnomalyScan> {
  return getJson('/market/anomali');
}

export function getEmitenNews(symbol: string, limit = 6): Promise<NewsResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/berita?limit=${limit}`);
}
