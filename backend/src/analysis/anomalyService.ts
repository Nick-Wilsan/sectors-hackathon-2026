import { getDailySeries } from '../data/transactions.js';
import { getNews } from '../data/news.js';
import { recentRange } from '../data/dateRange.js';
import { detectAnomaly, type AnomalyResult } from './anomaly.js';
import type { NewsArticle } from '../data/types.js';

export interface AnomalyWithContext extends AnomalyResult {
  /** Only populated when hasAnomaly is true. Explicitly not a causal claim (PRD F-06 kriteria selesai). */
  relatedNews: NewsArticle[];
  newsDisclaimer: string | null;
}

const NEWS_DISCLAIMER =
  'Berita berikut hanya kemungkinan konteks berdasarkan kedekatan waktu publikasi, bukan pernyataan hubungan sebab akibat yang pasti dengan anomali di atas.';

export async function getAnomalyWithContext(symbol: string): Promise<AnomalyWithContext> {
  // Max window the Sectors API allows per call — see ADD-SH2026-003 E-03.
  const series = await getDailySeries(symbol, recentRange(90));
  const anomaly = detectAnomaly(symbol, series.bars);

  if (!anomaly.hasAnomaly) {
    return { ...anomaly, relatedNews: [], newsDisclaimer: null };
  }

  const newsResult = await getNews({ symbols: [symbol], limit: 5 });
  return { ...anomaly, relatedNews: newsResult.articles, newsDisclaimer: NEWS_DISCLAIMER };
}
