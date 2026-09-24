import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// File-backed cache so repeated dev runs don't re-spend Sectors API credits.
// The default TTL is deliberately long: profiles, financials and valuation
// history are annual/quarterly figures, and credits — not freshness — are the
// scarce resource. Payloads that move daily pass their own shorter TTL.
const CACHE_DIR = join(process.cwd(), '.cache');
export const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// For payloads that change every trading day: prices, index, movers, news.
// Treated specially on read (see isFresh): valid until the calendar day ends,
// not for 24h after the fetch. A rolling 24h let widgets fetched at different
// hours straddle a session — the most-traded list already on 23 Sep while the
// IHSG it was compared against still ended on 22 Sep.
export const DAILY_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  /** Epoch ms when the payload was fetched. Older entries lack it; see ageOf. */
  cachedAt?: number;
  /** Legacy field, still written so older readers keep working. Not trusted on read. */
  expiresAt: number;
}

function cachePath(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
}

/**
 * Freshness is judged at READ time against the caller's TTL, not against an
 * expiry stamped at write time. The old scheme froze whatever TTL was in force
 * when the file was written: market widgets cached under the 30-day default on
 * 5 Sep kept serving 4 Sep movers and news on 24 Sep, long after their TTL had
 * been cut to one day — while the IHSG chart beside them was current.
 */
function isFresh(file: string, entry: CacheEntry<unknown>, ttlMs: number): boolean {
  const cachedAt = entry.cachedAt ?? statSync(file).mtimeMs;
  if (ttlMs === DAILY_TTL_MS) {
    // Same local calendar day, so every daily payload rolls over together.
    return new Date(cachedAt).toDateString() === new Date().toDateString();
  }
  return Date.now() - cachedAt <= ttlMs;
}

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | undefined {
  const file = cachePath(key);
  if (!existsSync(file)) return undefined;

  try {
    const entry = JSON.parse(readFileSync(file, 'utf-8')) as CacheEntry<T>;
    if (!isFresh(file, entry, ttlMs)) return undefined;
    return entry.value;
  } catch {
    return undefined;
  }
}

export function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const now = Date.now();
  const entry: CacheEntry<T> = { value, cachedAt: now, expiresAt: now + ttlMs };
  writeFileSync(cachePath(key), JSON.stringify(entry), 'utf-8');
}
