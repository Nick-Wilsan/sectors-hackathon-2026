import { createHash } from 'node:crypto';
import { getNews } from '../data/news.js';
import type { NewsArticle } from '../data/types.js';

// Berita index for the /berita page.
//
// Sectors charges 1 credit per news call and clamps `limit` to 30 (verified
// 6 Sep 2026: limit=50 silently returns 30 rows, no error). Rather than spend a
// credit on every filter change, sort, or page turn, the page is built on one
// fetched corpus: CORPUS_PAGES calls, merged and cached, with every facet below
// computed from it. All filtering and paging then happens in the browser at
// zero marginal cost.
const PAGE_SIZE = 30;
const CORPUS_PAGES = 4;

export interface Counted {
  key: string;
  count: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface NewsIndexAggregates {
  /** Topical tags by article count, sentiment tags removed. */
  tags: Counted[];
  /** Tickers by how many articles mention them. */
  symbols: Counted[];
  subSectors: Counted[];
  /** Publisher hostnames. */
  sources: Counted[];
  /** Articles per calendar day, oldest first — the publication rhythm. */
  perDay: DayCount[];
  /** Sectors' own topic axes (financials, future, valuation, ...). */
  dimensions: Counted[];
}

export interface NewsIndexResult {
  articles: NewsArticle[];
  /** Articles in the fetched corpus. */
  corpusSize: number;
  /** Total articles Sectors reports for this query, far larger than the corpus. */
  totalCount: number;
  aggregates: NewsIndexAggregates;
  fetchedAt: string;
}

// Sectors tidak memberi id pada artikel. URL sumbernya unik dan stabil, jadi
// ringkasannya dipakai sebagai penanda route — tetap sama di seluruh
// pengambilan korpus, sehingga tautan /berita/:id tidak basi tiap fetch.
function articleId(source: string): string {
  return createHash('sha1').update(source).digest('hex').slice(0, 10);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'sumber tidak dikenal';
  }
}

function tally(values: string[]): Counted[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function buildAggregates(articles: NewsArticle[]): NewsIndexAggregates {
  const perDayCounts = new Map<string, number>();
  for (const a of articles) {
    const day = a.timestamp.slice(0, 10);
    perDayCounts.set(day, (perDayCounts.get(day) ?? 0) + 1);
  }

  return {
    tags: tally(articles.flatMap((a) => a.tags ?? [])),
    symbols: tally(articles.flatMap((a) => a.symbols ?? [])),
    subSectors: tally(articles.flatMap((a) => a.subSector ?? [])),
    sources: tally(articles.map((a) => hostOf(a.source))),
    perDay: [...perDayCounts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    dimensions: tally(
      articles.flatMap((a) =>
        Object.entries(a.dimension ?? {})
          .filter(([, score]) => score > 0)
          .map(([axis]) => axis),
      ),
    ),
  };
}

/** Sebaran topik sebuah kumpulan artikel: sumbu isi milik Sectors dan tag penerbit. */
export function summarizeTopics(articles: NewsArticle[]): { dimensions: Counted[]; tags: Counted[] } {
  return {
    dimensions: tally(
      articles.flatMap((a) =>
        Object.entries(a.dimension ?? {})
          .filter(([, score]) => score > 0)
          .map(([axis]) => axis),
      ),
    ),
    tags: tally(articles.flatMap((a) => a.tags ?? [])),
  };
}

/**
 * Fetches the news corpus and every facet the /berita page needs.
 * Costs CORPUS_PAGES credits on a cold cache, zero afterwards.
 */
export async function getNewsIndex(): Promise<NewsIndexResult> {
  const pages = await Promise.all(
    Array.from({ length: CORPUS_PAGES }, (_, i) =>
      getNews({ limit: PAGE_SIZE, offset: i === 0 ? undefined : i * PAGE_SIZE }),
    ),
  );

  // Offsets can overlap when new articles are published between calls, so the
  // same story can arrive twice. Deduplicate on source URL, which is stable.
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];
  for (const page of pages) {
    for (const article of page.articles) {
      if (seen.has(article.source)) continue;
      seen.add(article.source);
      // Tag sentimen sudah dibuang di lapisan data (data/news.ts).
      articles.push({ ...article, id: articleId(article.source) });
    }
  }

  articles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    articles,
    corpusSize: articles.length,
    totalCount: pages[0]?.totalCount ?? articles.length,
    aggregates: buildAggregates(articles),
    fetchedAt: new Date().toISOString(),
  };
}
