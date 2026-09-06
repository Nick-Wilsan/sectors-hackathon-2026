import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// File-backed cache so repeated dev runs don't re-spend Sectors API credits.
// TTL is deliberately longer than the remaining competition window: profiles,
// financials and valuation history are annual/quarterly figures that will not
// change before submission, and credits — not freshness — are the scarce
// resource here. A 24h TTL made every new work day re-pay for the same payloads.
const CACHE_DIR = join(process.cwd(), '.cache');
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function cachePath(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
}

export function getCached<T>(key: string): T | undefined {
  const file = cachePath(key);
  if (!existsSync(file)) return undefined;

  try {
    const entry = JSON.parse(readFileSync(file, 'utf-8')) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.value;
  } catch {
    return undefined;
  }
}

export function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  writeFileSync(cachePath(key), JSON.stringify(entry), 'utf-8');
}
