import { config, requireEnv } from '../config.js';
import { getCached, setCached } from './cache.js';

const BASE_URL = 'https://api.sectors.app';

interface SectorsRequestOptions {
  params?: Record<string, string | number | undefined>;
  cacheTtlMs?: number;
}

export async function sectorsGet<T>(path: string, options: SectorsRequestOptions = {}): Promise<T> {
  const apiKey = config.sectorsApiKey || requireEnv('SECTORS_API_KEY');

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const cacheKey = url.toString();
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    throw new Error(`Sectors API error ${res.status} for ${url.pathname}: ${await res.text()}`);
  }

  const data = (await res.json()) as T;
  setCached(cacheKey, data, options.cacheTtlMs);
  return data;
}
