import { sectorsGet } from './sectorsClient.js';
import { DAILY_TTL_MS } from './cache.js';
import type { NewsArticle, NewsResult } from './types.js';

interface RawNewsItem {
  title: string;
  body?: string;
  source: string;
  timestamp: string;
  sector?: string;
  sub_sector?: string[];
  tags?: string[];
  symbols?: string[];
  thumbnail?: string | null;
  dimension?: Record<string, number>;
}

interface RawNewsResponse {
  results: RawNewsItem[];
  pagination: { total_count: number; has_next: boolean };
}

export interface GetNewsParams {
  symbols?: string[];
  sector?: string[];
  subSector?: string[];
  tags?: string[];
  keyword?: string;
  start?: string;
  end?: string;
  /** Clamped to 30 by the API — larger values return 30 rows without an error. */
  limit?: number;
  offset?: number;
}

// Sectors menandai tiap artikel dengan tag sentimen arah harga. Menampilkannya
// terbaca sebagai pandangan produk ini atas ke mana harga akan bergerak, yang
// dilarang PRD B-02. Penyaringan dilakukan DI SINI, di lapisan data, sehingga
// tidak ada satu pun jalur — halaman berita, berita emiten, konteks AI — yang
// bisa meloloskannya karena lupa menyaring sendiri.
const SENTIMENT_TAGS = new Set(['bullish', 'bearish', 'neutral']);

/** E-04: News Articles, IDX extension (1 credit per call). */
export async function getNews(params: GetNewsParams = {}): Promise<NewsResult> {
  const raw = await sectorsGet<RawNewsResponse>('/v2/news/', {
    params: {
      extension: 'idx',
      symbols: params.symbols?.join(','),
      sector: params.sector?.join(','),
      sub_sector: params.subSector?.join(','),
      tags: params.tags?.join(','),
      keyword: params.keyword,
      start: params.start,
      end: params.end,
      limit: params.limit,
      offset: params.offset,
    },
    cacheTtlMs: DAILY_TTL_MS,
  });

  const articles: NewsArticle[] = raw.results.map((item) => ({
    title: item.title,
    body: item.body,
    source: item.source,
    timestamp: item.timestamp,
    sector: item.sector,
    subSector: item.sub_sector,
    tags: (item.tags ?? []).filter((t) => !SENTIMENT_TAGS.has(t.toLowerCase())),
    symbols: item.symbols,
    thumbnail: item.thumbnail,
    dimension: item.dimension,
  }));

  return { articles, totalCount: raw.pagination.total_count, fetchedAt: new Date().toISOString() };
}
