import type { AnomalyResult, CandlestickResult, CompositeScoreResult, DailySeries, FrameworkResult, IndicatorResult, PatternSimilarityResult, PeerComparisonResult, ScreenerResult, SubsectorOption } from './types';

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

export function getCompositeScore(symbol: string): Promise<CompositeScoreResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/skor`);
}

export function getPeerComparison(symbol: string): Promise<PeerComparisonResult> {
  return getJson(`/emiten/${encodeURIComponent(symbol)}/peer`);
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

export interface ScreenerQuery {
  subSector: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  minScore?: number;
  limit?: number;
}

export function screenCompanies(query: ScreenerQuery): Promise<ScreenerResult> {
  const params = new URLSearchParams();
  params.set('subSector', query.subSector);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDirection) params.set('sortDirection', query.sortDirection);
  if (query.minScore !== undefined) params.set('minScore', String(query.minScore));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  return getJson(`/screener?${params.toString()}`);
}
