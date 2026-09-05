import { sma, rsi } from 'technicalindicators';
import type { DailyBar } from '../data/types.js';

// F-08 Indikator Teknikal. Technical Spec 5.5: "Kedua indikator menggunakan
// data yang identik dengan pengenalan pola candlestick sehingga tidak
// menambah pemanggilan data baru" — computed from the same 90-day close
// series F-06/F-07 already fetch, no new Sectors API calls.

const MA_PERIODS = [20, 50];
const RSI_PERIOD = 14;

export const INDICATOR_EXPLANATIONS = {
  movingAverage:
    'Rata-rata bergerak (MA) meratakan harga penutupan pada sejumlah hari terakhir menjadi satu garis, sehingga arah tren lebih mudah dilihat tanpa terganggu naik-turun harga harian. Garis MA20 mengikuti harga lebih cepat, MA50 lebih lambat dan lebih halus.',
  rsi:
    'Indeks Kekuatan Relatif (RSI) membandingkan rata-rata kenaikan dan rata-rata penurunan harga dalam 14 hari terakhir, pada skala 0 sampai 100. Angka di atas 70 menunjukkan kenaikan harga yang tergolong cepat dibanding kebiasaannya, angka di bawah 30 menunjukkan penurunan yang tergolong cepat. Ini deskripsi kondisi statistik semata, bukan sinyal untuk membeli atau menjual.',
};

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
  explanation: typeof INDICATOR_EXPLANATIONS;
}

export function computeIndicators(symbol: string, bars: DailyBar[]): IndicatorResult {
  const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((b) => b.date);
  const closes = sorted.map((b) => b.close);

  if (closes.length < RSI_PERIOD + 1) {
    return { symbol, status: 'inadequate', movingAverages: [], rsi: null, explanation: INDICATOR_EXPLANATIONS };
  }

  // sma()/rsi() return fewer points than the input (need `period` closes to
  // produce the first value) — output[i] aligns to input[i + period - 1].
  const movingAverages: MovingAverageSeries[] = MA_PERIODS.filter((period) => closes.length >= period).map(
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

  const rsiValues = rsi({ period: RSI_PERIOD, values: closes });
  const rsiOffset = closes.length - rsiValues.length;
  const rsiSeries: RsiSeries = {
    period: RSI_PERIOD,
    points: rsiValues.map((value, i) => ({ date: dates[rsiOffset + i], value })),
  };

  return { symbol, status: 'ok', movingAverages, rsi: rsiSeries, explanation: INDICATOR_EXPLANATIONS };
}
