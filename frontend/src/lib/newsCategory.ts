import type { NewsArticleFull } from '../api/types';

// Our news data model only carries `sector`/`subSector`/`tags` (IDX taxonomy
// slugs), not the editorial categories the reference mockup shows as tabs
// ("Regulasi & IPO", "Analisis Aliran Dana", ...). This buckets each article
// into one of a handful of real, keyword-derived categories instead of
// fabricating a taxonomy the API doesn't provide.
export const NEWS_CATEGORIES = ['Semua', 'Korporasi', 'Dividen & IPO', 'Makro'] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

const MAKRO_KEYWORDS = ['bank indonesia', 'suku bunga', 'inflasi', 'makro', 'ihsg', 'ekonomi', 'bi rate', 'the fed', 'rupiah', 'gdp', 'pdb'];
const DIVIDEN_IPO_KEYWORDS = ['dividen', 'dividend', 'ipo', 'right issue', 'merger', 'akuisisi', 'buyback', 'stock split', 'go public'];

export function categorizeNews(article: NewsArticleFull): Exclude<NewsCategory, 'Semua'> {
  const haystack = `${article.title} ${(article.tags ?? []).join(' ')}`.toLowerCase();
  if (MAKRO_KEYWORDS.some((k) => haystack.includes(k))) return 'Makro';
  if (DIVIDEN_IPO_KEYWORDS.some((k) => haystack.includes(k))) return 'Dividen & IPO';
  return 'Korporasi';
}

/** IDX sub-sector slugs come back lowercase-hyphenated (e.g. "heavy-constructions-civil-engineering") — render as Title Case like the rest of the app's labels, not the raw API slug. */
export function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Real estimate from the article's own body length (~200 words/min), not a fabricated figure — falls back to null when body wasn't fetched. */
export function estimateReadingMinutes(article: NewsArticleFull): number | null {
  if (!article.body) return null;
  const words = article.body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return null;
  return Math.max(1, Math.round(words / 200));
}
