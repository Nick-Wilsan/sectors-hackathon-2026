import type { DailyBar } from '../data/types.js';

// F-06 Deteksi Anomali. Technical Spec 5.3: "Ambang batas penyimpangan
// ditetapkan di awal dan wajib didokumentasikan... Keluaran wajib berbentuk
// pernyataan faktual mengenai besaran penyimpangan yang terukur. Keluaran
// dilarang menyatakan penyebab maupun perkiraan kelanjutan pergerakan."
//
// Method: z-score against a trailing baseline, EXCLUDING the day being
// evaluated (comparing "today" to "the recent past", not to itself). Applied
// to two independent signals — daily volume and daily close-to-close return —
// since a volume spike and a price spike are different phenomena and either
// alone is meaningful.

export const Z_SCORE_THRESHOLD = 2; // documented threshold: 2 standard deviations from the baseline mean
export const MIN_BASELINE_DAYS = 10; // fewer data points -> stddev is not statistically meaningful

export interface AnomalyMetric {
  key: 'volume' | 'priceChange';
  label: string;
  latestValue: number;
  baselineMean: number;
  baselineStdDev: number;
  baselineDays: number;
  zScore: number;
  isAnomaly: boolean;
}

export interface AnomalyResult {
  symbol: string;
  /** Trading date being evaluated (the most recent bar in the series). */
  date: string | null;
  status: 'ok' | 'inadequate';
  threshold: number;
  metrics: AnomalyMetric[];
  hasAnomaly: boolean;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[], m: number): number {
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function zScoreOf(value: number, baseline: number[]): { mean: number; stdDev: number; z: number } {
  const m = mean(baseline);
  const sd = stdDev(baseline, m);
  return { mean: m, stdDev: sd, z: sd === 0 ? 0 : (value - m) / sd };
}

export function detectAnomaly(symbol: string, bars: DailyBar[]): AnomalyResult {
  const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));

  const returns: { date: string; value: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevClose = sorted[i - 1].close;
    if (prevClose > 0) {
      returns.push({ date: sorted[i].date, value: (sorted[i].close - prevClose) / prevClose });
    }
  }

  if (sorted.length < MIN_BASELINE_DAYS + 1 || returns.length < MIN_BASELINE_DAYS + 1) {
    return {
      symbol,
      date: sorted[sorted.length - 1]?.date ?? null,
      status: 'inadequate',
      threshold: Z_SCORE_THRESHOLD,
      metrics: [],
      hasAnomaly: false,
    };
  }

  const latestBar = sorted[sorted.length - 1];
  const volumeBaseline = sorted.slice(0, -1).map((b) => b.volume);
  const volume = zScoreOf(latestBar.volume, volumeBaseline);

  const latestReturn = returns[returns.length - 1];
  const returnBaseline = returns.slice(0, -1).map((r) => r.value);
  const priceChange = zScoreOf(latestReturn.value, returnBaseline);

  const metrics: AnomalyMetric[] = [
    {
      key: 'volume',
      label: 'Volume Perdagangan',
      latestValue: latestBar.volume,
      baselineMean: volume.mean,
      baselineStdDev: volume.stdDev,
      baselineDays: volumeBaseline.length,
      zScore: volume.z,
      isAnomaly: Math.abs(volume.z) > Z_SCORE_THRESHOLD,
    },
    {
      key: 'priceChange',
      label: 'Perubahan Harga Harian',
      latestValue: latestReturn.value,
      baselineMean: priceChange.mean,
      baselineStdDev: priceChange.stdDev,
      baselineDays: returnBaseline.length,
      zScore: priceChange.z,
      isAnomaly: Math.abs(priceChange.z) > Z_SCORE_THRESHOLD,
    },
  ];

  return {
    symbol,
    date: latestBar.date,
    status: 'ok',
    threshold: Z_SCORE_THRESHOLD,
    metrics,
    hasAnomaly: metrics.some((m) => m.isAnomaly),
  };
}
