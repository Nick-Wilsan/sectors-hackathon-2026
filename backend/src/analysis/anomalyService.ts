import { getDailySeries } from '../data/transactions.js';
import { getNews } from '../data/news.js';
import { recentRange } from '../data/dateRange.js';
import { detectAnomaly, type AnomalyResult } from './anomaly.js';
import { getMarketRelativeMove, MARKET_CONTEXT_DISCLAIMER, type MarketRelativeMove } from './marketContext.js';
import type { NewsArticle } from '../data/types.js';

export interface AnomalyWithContext extends AnomalyResult {
  /** Only populated when hasAnomaly is true. Explicitly not a causal claim (PRD F-06 kriteria selesai). */
  relatedNews: NewsArticle[];
  newsDisclaimer: string | null;
  /**
   * Same-day comparison against IHSG. Answers the market-wide half of "why did
   * this move" with a measurement rather than a guessed event; null when the
   * index has no bar for that trading date. Costs no credit — the index series
   * is already in cache for the dashboard.
   */
  marketContext: MarketRelativeMove | null;
  marketContextDisclaimer: string | null;
}

const NEWS_DISCLAIMER =
  'Berita berikut hanya kemungkinan konteks berdasarkan kedekatan waktu publikasi, bukan pernyataan hubungan sebab akibat yang pasti dengan anomali di atas.';

export async function getAnomalyWithContext(symbol: string): Promise<AnomalyWithContext> {
  // Max window the Sectors API allows per call — see ADD-SH2026-003 E-03.
  const series = await getDailySeries(symbol, recentRange(90));
  const anomaly = detectAnomaly(symbol, series.bars);

  // Shown whether or not a threshold was breached: "the whole market moved
  // today" is useful context for a normal day too, and it costs nothing.
  const marketContext = await getMarketRelativeMove(series.bars).catch(() => null);
  const marketBlock = {
    marketContext,
    marketContextDisclaimer: marketContext ? MARKET_CONTEXT_DISCLAIMER : null,
  };

  if (!anomaly.hasAnomaly) {
    return { ...anomaly, relatedNews: [], newsDisclaimer: null, ...marketBlock };
  }

  const newsResult = await getNews({ symbols: [symbol], limit: 5 });
  return { ...anomaly, relatedNews: newsResult.articles, newsDisclaimer: NEWS_DISCLAIMER, ...marketBlock };
}
