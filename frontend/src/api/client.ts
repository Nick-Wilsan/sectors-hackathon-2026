import type { CompositeScoreResult, PeerComparisonResult, ScreenerResult, SubsectorOption } from './types';

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
