import { config, requireEnv } from '../config.js';
import { getCached, setCached } from './cache.js';

const BASE_URL = 'https://api.sectors.app';

interface SectorsRequestOptions {
  params?: Record<string, string | number | undefined>;
  cacheTtlMs?: number;
}

// Requests already in flight, keyed by full URL. Without this, two concurrent
// callers asking for the same URL both miss the file cache (neither has written
// it yet) and Sectors charges twice. Observed for real: a screener scan and a
// peer lookup running in parallel double-charged five bank reports in one minute.
const inFlight = new Map<string, Promise<unknown>>();

// Running count of requests that actually reached Sectors this process — i.e.
// credits spent. Manual estimates in the docs drifted 439 credits from reality;
// this makes the number observable instead of guessed.
let creditsSpent = 0;

export function getCreditsSpent(): number {
  return creditsSpent;
}

export async function sectorsGet<T>(path: string, options: SectorsRequestOptions = {}): Promise<T> {
  const apiKey = config.sectorsApiKey || requireEnv('SECTORS_API_KEY');

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const cacheKey = url.toString();
  const cached = getCached<T>(cacheKey, options.cacheTtlMs);
  if (cached) return cached;

  const pending = inFlight.get(cacheKey);
  if (pending) return (await pending) as T;

  const request = (async (): Promise<T> => {
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      throw new Error(`Sectors API error ${res.status} for ${url.pathname}: ${await res.text()}`);
    }

    const data = (await res.json()) as T;
    creditsSpent += 1;
    console.log(`[sectors] credit spent (#${creditsSpent} this run): ${url.pathname}${url.search}`);
    setCached(cacheKey, data, options.cacheTtlMs);
    return data;
  })();

  inFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inFlight.delete(cacheKey);
  }
}
