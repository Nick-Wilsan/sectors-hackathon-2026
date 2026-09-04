import type { DailyBar } from '../data/types.js';

// F-09 Pattern Similarity Lintas Saham (opsional/P4). PRD kriteria selesai:
// "hasil disajikan murni sebagai laporan historis... peringatan eksplisit
// bahwa kemiripan pola masa lalu tidak menjamin terulangnya pergerakan yang
// sama." This never predicts anything — it reports what a similar-shaped
// historical window was followed by, as a fact about the past.

export const SIMILARITY_WARNING =
  'Laporan ini murni historis dan statistik. Kemiripan bentuk pergerakan harga pada emiten lain di masa lalu tidak menjamin bahwa emiten ini akan mengalami pergerakan yang sama, dan bukan perkiraan maupun rekomendasi.';

export interface SimilarityMatch {
  symbol: string;
  companyName: string;
  matchStartDate: string;
  matchEndDate: string;
  /** Higher = more similar shape. Derived from Euclidean distance between normalized price shapes. */
  similarity: number;
  outcomeWindowDays: number;
  /** % price change in the outcomeWindowDays after the matched window. null if not enough trailing data. */
  outcomeChangePercent: number | null;
}

export interface PatternSimilarityResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  windowDays: number;
  outcomeWindowDays: number;
  warning: string;
  matches: SimilarityMatch[];
}

export interface CandidateSeries {
  symbol: string;
  companyName: string;
  bars: DailyBar[];
}

/** Normalizes a close-price series into % change from its first value, so absolute price level doesn't affect comparison. */
function normalizeShape(closes: number[]): number[] {
  const base = closes[0];
  return closes.map((c) => (c - base) / base);
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

interface WindowMatch {
  startIndex: number;
  distance: number;
  outcomeChangePercent: number | null;
}

function findBestWindow(targetShape: number[], bars: DailyBar[], windowDays: number, outcomeWindowDays: number): WindowMatch | null {
  const closes = bars.map((b) => b.close);
  let best: WindowMatch | null = null;

  for (let start = 0; start + windowDays <= closes.length; start++) {
    const shape = normalizeShape(closes.slice(start, start + windowDays));
    const distance = euclideanDistance(targetShape, shape);
    if (best === null || distance < best.distance) {
      const windowEndIndex = start + windowDays - 1;
      const outcomeIndex = windowEndIndex + outcomeWindowDays;
      const outcomeChangePercent =
        outcomeIndex < closes.length ? (closes[outcomeIndex] - closes[windowEndIndex]) / closes[windowEndIndex] : null;
      best = { startIndex: start, distance, outcomeChangePercent };
    }
  }

  return best;
}

export function computePatternSimilarity(
  target: { symbol: string; bars: DailyBar[] },
  candidates: CandidateSeries[],
  options: { windowDays?: number; outcomeWindowDays?: number; topN?: number } = {},
): PatternSimilarityResult {
  const windowDays = options.windowDays ?? 20;
  const outcomeWindowDays = options.outcomeWindowDays ?? 5;
  const topN = options.topN ?? 5;

  const sortedTarget = [...target.bars].sort((a, b) => a.date.localeCompare(b.date));
  const targetCloses = sortedTarget.slice(-windowDays).map((b) => b.close);

  if (targetCloses.length < windowDays) {
    return { symbol: target.symbol, status: 'inadequate', windowDays, outcomeWindowDays, warning: SIMILARITY_WARNING, matches: [] };
  }

  const targetShape = normalizeShape(targetCloses);
  const matches: SimilarityMatch[] = [];

  for (const candidate of candidates) {
    const sortedBars = [...candidate.bars].sort((a, b) => a.date.localeCompare(b.date));
    if (sortedBars.length < windowDays) continue;

    const best = findBestWindow(targetShape, sortedBars, windowDays, outcomeWindowDays);
    if (!best) continue;

    matches.push({
      symbol: candidate.symbol,
      companyName: candidate.companyName,
      matchStartDate: sortedBars[best.startIndex].date,
      matchEndDate: sortedBars[best.startIndex + windowDays - 1].date,
      similarity: 1 / (1 + best.distance),
      outcomeWindowDays,
      outcomeChangePercent: best.outcomeChangePercent,
    });
  }

  matches.sort((a, b) => b.similarity - a.similarity);

  return {
    symbol: target.symbol,
    status: 'ok',
    windowDays,
    outcomeWindowDays,
    warning: SIMILARITY_WARNING,
    matches: matches.slice(0, topN),
  };
}
