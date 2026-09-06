import { sma, rsi } from 'technicalindicators';
import type { DailyBar } from '../data/types.js';

// F-08 Indikator Teknikal. Technical Spec 5.5: "Kedua indikator menggunakan
// data yang identik dengan pengenalan pola candlestick sehingga tidak
// menambah pemanggilan data baru" — computed from the same 90-day close
// series F-06/F-07 already fetch, no new Sectors API calls.

const DEFAULT_MA_PERIODS = [20, 50];
const DEFAULT_RSI_PERIOD = 14;

// Bounds for user-chosen periods. A period below 2 is meaningless and one
// longer than the series produces an empty line that looks like a bug; the
// clamp keeps a hand-typed query string from producing either.
const MIN_PERIOD = 2;
const MAX_PERIOD = 200;
const MAX_MA_LINES = 3;

/** Periods a reader may pick in the UI. Offered as a fixed list rather than a
 *  free number box: these are the conventional settings, and a picker teaches
 *  what is worth changing while a blank box just invites noise. */
export const MA_PERIOD_CHOICES = [5, 10, 20, 50, 100, 200];
export const RSI_PERIOD_CHOICES = [7, 14, 21, 28];

export interface IndicatorOptions {
  maPeriods?: number[];
  rsiPeriod?: number;
}

function clampPeriod(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const n = Math.round(value);
  return n < MIN_PERIOD || n > MAX_PERIOD ? null : n;
}

/** Parses `?ma=20,50&rsi=14` into validated options; anything unparseable
 *  falls back to the defaults rather than erroring the whole panel. */
export function parseIndicatorOptions(maParam?: string, rsiParam?: string): IndicatorOptions {
  const maPeriods = (maParam ?? '')
    .split(',')
    .map((p) => clampPeriod(Number(p.trim())))
    .filter((p): p is number => p !== null);

  const unique = [...new Set(maPeriods)].sort((a, b) => a - b).slice(0, MAX_MA_LINES);
  const rsiPeriod = clampPeriod(Number(rsiParam));

  return {
    maPeriods: unique.length > 0 ? unique : undefined,
    rsiPeriod: rsiPeriod ?? undefined,
  };
}

export interface IndicatorExplanations {
  movingAverage: string;
  rsi: string;
}

// The wording quotes the periods actually in use. When these were fixed at
// MA20/MA50/RSI14 the copy named them literally; now that a reader can change
// them, a static sentence would describe a chart they are not looking at.
export function explainIndicators(maPeriods: number[], rsiPeriod: number): IndicatorExplanations {
  const sorted = [...maPeriods].sort((a, b) => a - b);
  const tercepat = sorted[0];
  const terlambat = sorted[sorted.length - 1];

  const bandingan =
    sorted.length > 1
      ? ` Garis MA${tercepat} mengikuti harga lebih cepat, MA${terlambat} lebih lambat dan lebih halus.`
      : '';

  return {
    movingAverage:
      'Rata-rata bergerak (MA) meratakan harga penutupan pada sejumlah hari terakhir menjadi satu garis, sehingga arah tren lebih mudah dilihat tanpa terganggu naik-turun harga harian. ' +
      `Angka di belakang nama menyebut jumlah harinya: MA${sorted.length > 0 ? tercepat : 20} memakai rata-rata ${sorted.length > 0 ? tercepat : 20} hari terakhir.` +
      bandingan +
      ' Semakin besar angkanya, semakin halus garisnya dan semakin lambat ia bereaksi terhadap perubahan harga.',
    rsi:
      `Indeks Kekuatan Relatif (RSI) membandingkan rata-rata kenaikan dan rata-rata penurunan harga dalam ${rsiPeriod} hari terakhir, pada skala 0 sampai 100. ` +
      'Angka di atas 70 menunjukkan kenaikan harga yang tergolong cepat dibanding kebiasaannya, angka di bawah 30 menunjukkan penurunan yang tergolong cepat. ' +
      'Periode yang lebih pendek membuat RSI lebih sering menyentuh kedua batas itu, periode yang lebih panjang membuatnya lebih tenang. ' +
      'Ini deskripsi kondisi statistik semata, bukan sinyal untuk membeli atau menjual.',
  };
}

export interface IndicatorPoint {
  date: string;
  value: number;
}

export interface MovingAverageSeries {
  period: number;
  label: string;
  points: IndicatorPoint[];
}

export interface RsiSeries {
  period: number;
  points: IndicatorPoint[];
}

export interface IndicatorResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  movingAverages: MovingAverageSeries[];
  rsi: RsiSeries | null;
  explanation: IndicatorExplanations;
  /** Periods actually used, which may differ from those asked for: a period
   *  longer than the available history is dropped rather than drawn empty. */
  maPeriods: number[];
  rsiPeriod: number;
  maPeriodChoices: number[];
  rsiPeriodChoices: number[];
  /** Bars available — the ceiling on any period that can be drawn. */
  barsAvailable: number;
}

export function computeIndicators(symbol: string, bars: DailyBar[], options: IndicatorOptions = {}): IndicatorResult {
  const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((b) => b.date);
  const closes = sorted.map((b) => b.close);

  const requestedMa = options.maPeriods ?? DEFAULT_MA_PERIODS;
  const rsiPeriod = options.rsiPeriod ?? DEFAULT_RSI_PERIOD;

  const meta = {
    maPeriodChoices: MA_PERIOD_CHOICES,
    rsiPeriodChoices: RSI_PERIOD_CHOICES,
    barsAvailable: closes.length,
  };

  if (closes.length < rsiPeriod + 1) {
    return {
      symbol,
      status: 'inadequate',
      movingAverages: [],
      rsi: null,
      explanation: explainIndicators(DEFAULT_MA_PERIODS, rsiPeriod),
      maPeriods: [],
      rsiPeriod,
      ...meta,
    };
  }

  // sma()/rsi() return fewer points than the input (need `period` closes to
  // produce the first value) — output[i] aligns to input[i + period - 1].
  const usableMa = requestedMa.filter((period) => closes.length >= period);
  const movingAverages: MovingAverageSeries[] = usableMa.map(
    (period) => {
      const values = sma({ period, values: closes });
      const offset = closes.length - values.length;
      return {
        period,
        label: `MA${period}`,
        points: values.map((value, i) => ({ date: dates[offset + i], value })),
      };
    },
  );

  const rsiValues = rsi({ period: rsiPeriod, values: closes });
  const rsiOffset = closes.length - rsiValues.length;
  const rsiSeries: RsiSeries = {
    period: rsiPeriod,
    points: rsiValues.map((value, i) => ({ date: dates[rsiOffset + i], value })),
  };

  return {
    symbol,
    status: 'ok',
    movingAverages,
    rsi: rsiSeries,
    explanation: explainIndicators(usableMa, rsiPeriod),
    maPeriods: usableMa,
    rsiPeriod,
    ...meta,
  };
}
