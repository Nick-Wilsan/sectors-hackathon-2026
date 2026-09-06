import { sectorsGet } from './sectorsClient.js';
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
  });

  const articles: NewsArticle[] = raw.results.map((item) => ({
    title: item.title,
    body: item.body,
    source: item.source,
    timestamp: item.timestamp,
    sector: item.sector,
    subSector: item.sub_sector,
    tags: item.tags,
    symbols: item.symbols,
    thumbnail: item.thumbnail,
    dimension: item.dimension,
  }));

  return { articles, totalCount: raw.pagination.total_count, fetchedAt: new Date().toISOString() };
}
