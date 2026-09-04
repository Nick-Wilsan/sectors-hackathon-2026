import {
  doji,
  dragonflydoji,
  gravestonedoji,
  bullishengulfingpattern,
  bearishengulfingpattern,
  morningstar,
  eveningstar,
  threewhitesoldiers,
  threeblackcrows,
  hammerpattern,
  shootingstar,
  bullishharami,
  bearishharami,
} from 'technicalindicators';
import type { DailyBar } from '../data/types.js';

// F-07 Pengenalan Pola Candlestick. Technical Spec 5.4: "Memanfaatkan pustaka
// yang sudah ada adalah pilihan yang tepat di sini, karena waktu yang dihemat
// lebih berharga daripada nilai tambah menulis ulang aturan yang sudah baku."
// Detection rules come from `technicalindicators` (well-established, MIT-
// licensed candlestick library) rather than being reimplemented here.
//
// The library's exported functions (e.g. `doji(data)`) only report whether
// the LAST candle(s) in the array they're given match — there's no built-in
// "scan a whole series and return every match date." We get that by calling
// each function on every growing prefix of the series (index 0..i), which
// works uniformly regardless of how many trailing candles a given pattern
// needs, since each function already looks only at the tail of what it's given.

export type PatternCategory = 'reversal-bullish' | 'reversal-bearish' | 'indecision';

export interface PatternDefinition {
  key: string;
  label: string;
  category: PatternCategory;
  definition: string;
  detect: (data: { open: number[]; high: number[]; low: number[]; close: number[] }) => boolean;
}

// >= 8 required by PRD F-07 kriteria selesai — 12 defined here, spanning all
// three standard categories used in technical analysis literature.
export const PATTERNS: PatternDefinition[] = [
  {
    key: 'doji',
    label: 'Doji',
    category: 'indecision',
    definition: 'Harga pembukaan dan penutupan hampir sama, membentuk badan candle yang sangat tipis. Menandakan keragu-raguan pasar antara pembeli dan penjual.',
    detect: doji,
  },
  {
    key: 'dragonflydoji',
    label: 'Dragonfly Doji',
    category: 'reversal-bullish',
    definition: 'Doji dengan bayangan bawah panjang dan nyaris tanpa bayangan atas, muncul setelah tren turun. Menunjukkan penjual sempat mendominasi namun pembeli mendorong harga kembali naik.',
    detect: dragonflydoji,
  },
  {
    key: 'gravestonedoji',
    label: 'Gravestone Doji',
    category: 'reversal-bearish',
    definition: 'Doji dengan bayangan atas panjang dan nyaris tanpa bayangan bawah, muncul setelah tren naik. Menunjukkan pembeli sempat mendominasi namun penjual mendorong harga kembali turun.',
    detect: gravestonedoji,
  },
  {
    key: 'bullishengulfingpattern',
    label: 'Bullish Engulfing',
    category: 'reversal-bullish',
    definition: 'Candle naik yang badannya sepenuhnya menutupi (mengurung) badan candle turun sebelumnya. Menandakan pembeli mengambil alih dominasi dari penjual.',
    detect: bullishengulfingpattern,
  },
  {
    key: 'bearishengulfingpattern',
    label: 'Bearish Engulfing',
    category: 'reversal-bearish',
    definition: 'Candle turun yang badannya sepenuhnya menutupi (mengurung) badan candle naik sebelumnya. Menandakan penjual mengambil alih dominasi dari pembeli.',
    detect: bearishengulfingpattern,
  },
  {
    key: 'morningstar',
    label: 'Morning Star',
    category: 'reversal-bullish',
    definition: 'Tiga candle berurutan: candle turun besar, candle bertubuh kecil (jeda), lalu candle naik besar yang menutup di atas titik tengah candle pertama. Pola pembalikan dari tren turun ke naik.',
    detect: morningstar,
  },
  {
    key: 'eveningstar',
    label: 'Evening Star',
    category: 'reversal-bearish',
    definition: 'Tiga candle berurutan: candle naik besar, candle bertubuh kecil (jeda), lalu candle turun besar yang menutup di bawah titik tengah candle pertama. Pola pembalikan dari tren naik ke turun.',
    detect: eveningstar,
  },
  {
    key: 'threewhitesoldiers',
    label: 'Three White Soldiers',
    category: 'reversal-bullish',
    definition: 'Tiga candle naik berturut-turut, masing-masing dibuka di dalam badan candle sebelumnya dan ditutup lebih tinggi. Menandakan momentum kenaikan yang kuat dan berkelanjutan.',
    detect: threewhitesoldiers,
  },
  {
    key: 'threeblackcrows',
    label: 'Three Black Crows',
    category: 'reversal-bearish',
    definition: 'Tiga candle turun berturut-turut, masing-masing dibuka di dalam badan candle sebelumnya dan ditutup lebih rendah. Menandakan momentum penurunan yang kuat dan berkelanjutan.',
    detect: threeblackcrows,
  },
  {
    key: 'hammerpattern',
    label: 'Hammer',
    category: 'reversal-bullish',
    definition: 'Candle dengan badan kecil di bagian atas dan bayangan bawah panjang (minimal dua kali badan), muncul setelah tren turun. Menandakan tekanan jual mulai ditahan pembeli.',
    detect: hammerpattern,
  },
  {
    key: 'shootingstar',
    label: 'Shooting Star',
    category: 'reversal-bearish',
    definition: 'Candle dengan badan kecil di bagian bawah dan bayangan atas panjang, muncul setelah tren naik. Menandakan tekanan beli mulai ditahan penjual.',
    detect: shootingstar,
  },
  {
    key: 'bullishharami',
    label: 'Bullish Harami',
    category: 'reversal-bullish',
    definition: 'Candle bertubuh kecil yang sepenuhnya berada di dalam rentang badan candle turun besar sebelumnya. Menandakan momentum turun mulai melemah.',
    detect: bullishharami,
  },
  {
    key: 'bearishharami',
    label: 'Bearish Harami',
    category: 'reversal-bearish',
    definition: 'Candle bertubuh kecil yang sepenuhnya berada di dalam rentang badan candle naik besar sebelumnya. Menandakan momentum naik mulai melemah.',
    detect: bearishharami,
  },
];

export const RELIABILITY_WARNING =
  'Pola candlestick dikenali murni dari hubungan matematis harga pembukaan, tertinggi, terendah, dan penutupan mengikuti definisi baku analisis teknikal. Keandalan tiap pola bervariasi dan tidak menjamin arah pergerakan harga selanjutnya.';

export interface PatternMatch {
  key: string;
  label: string;
  category: PatternCategory;
  definition: string;
  date: string;
  index: number;
}

export interface CandlestickResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  reliabilityWarning: string;
  matches: PatternMatch[];
}

const MIN_BARS = 3; // shortest pattern (single-candle) still needs a little context; multi-candle patterns need up to 3

export function detectCandlestickPatterns(symbol: string, bars: DailyBar[]): CandlestickResult {
  const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < MIN_BARS) {
    return { symbol, status: 'inadequate', reliabilityWarning: RELIABILITY_WARNING, matches: [] };
  }

  const opens = sorted.map((b) => b.open ?? b.close);
  const highs = sorted.map((b) => b.high ?? b.close);
  const lows = sorted.map((b) => b.low ?? b.close);
  const closes = sorted.map((b) => b.close);

  const matches: PatternMatch[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const window = {
      open: opens.slice(0, i + 1),
      high: highs.slice(0, i + 1),
      low: lows.slice(0, i + 1),
      close: closes.slice(0, i + 1),
    };

    for (const pattern of PATTERNS) {
      if (pattern.detect(window)) {
        matches.push({
          key: pattern.key,
          label: pattern.label,
          category: pattern.category,
          definition: pattern.definition,
          date: sorted[i].date,
          index: i,
        });
      }
    }
  }

  return { symbol, status: 'ok', reliabilityWarning: RELIABILITY_WARNING, matches };
}
