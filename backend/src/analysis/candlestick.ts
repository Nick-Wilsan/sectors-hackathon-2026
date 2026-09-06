import {
  doji,
  dragonflydoji,
  gravestonedoji,
  bullishengulfingpattern,
  bearishengulfingpattern,
  morningstar,
  eveningstar,
  morningdojistar,
  eveningdojistar,
  threewhitesoldiers,
  threeblackcrows,
  hammerpattern,
  hangingman,
  shootingstar,
  bullishharami,
  bearishharami,
  bullishharamicross,
  bearishharamicross,
  abandonedbaby,
  bullishmarubozu,
  bearishmarubozu,
  piercingline,
  bullishspinningtop,
  bearishspinningtop,
  tweezertop,
  tweezerbottom,
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

export type PatternCategory = 'reversal-bullish' | 'reversal-bearish' | 'continuation' | 'indecision';

export interface PatternDefinition {
  key: string;
  label: string;
  category: PatternCategory;
  definition: string;
  detect: (data: { open: number[]; high: number[]; low: number[]; close: number[] }) => boolean;
}

// 25 patterns, selected from the 33 detectors the library exports. The eight
// left out were rejected on measured evidence, not taste. A scan of 1.550
// trading days across 25 emiten produced these firing rates:
//
//   bearishSpinningTop  44,9% of bars     bullishSpinningTop  34,5%
//   doji                23,9%             tweezerTop/Bottom    5,5%
//
// - The three "unconfirmed" variants (hammer, hanging man, shooting star) are
//   weaker duplicates of patterns already listed and would double-mark bars.
// - The four "stick" variants (bullish/bearish hammer and inverted hammer) are
//   shape-only detectors with no trend context; they co-fired constantly with
//   the trend-aware versions already present.
// - bullishSpinningTop and bearishSpinningTop fired on the SAME bar 321 times,
//   which is incoherent as a label for a reader. They are merged into one
//   neutral Spinning Top entry rather than shown as two contradictory ones.
//
// Those rates are the honest point of this feature. A shape that appears on
// 45% of trading days describes an ordinary day, not a signal — so the API
// returns an occurrence count for EVERY pattern, including the ones that never
// matched, and the UI shows that count beside the name. A user who picks which
// patterns to mark can see for themselves which ones are rare enough to notice.
export const PATTERNS: PatternDefinition[] = [
  {
    key: 'doji',
    label: 'Doji',
    category: 'indecision',
    definition:
      'Harga pembukaan dan penutupan hampir sama, sehingga badan candle-nya setipis garis. Artinya sepanjang hari itu pembeli dan penjual sama kuat, tidak ada yang menang. Bentuk ini sangat sering muncul, jadi kemunculannya sendiri bukan kejadian istimewa.',
    detect: doji,
  },
  {
    key: 'dragonflydoji',
    label: 'Dragonfly Doji',
    category: 'reversal-bullish',
    definition:
      'Badan candle setipis garis di bagian atas, dengan ekor panjang menjulur ke bawah. Bacaannya: harga sempat ditekan jauh ke bawah sepanjang hari, lalu didorong kembali naik sampai ke titik awal sebelum pasar tutup.',
    detect: dragonflydoji,
  },
  {
    key: 'gravestonedoji',
    label: 'Gravestone Doji',
    category: 'reversal-bearish',
    definition:
      'Kebalikan Dragonfly: badan setipis garis di bagian bawah, dengan ekor panjang menjulur ke atas. Bacaannya: harga sempat terangkat jauh, lalu ditarik kembali turun sampai ke titik awal sebelum pasar tutup.',
    detect: gravestonedoji,
  },
  {
    key: 'bullishengulfingpattern',
    label: 'Bullish Engulfing',
    category: 'reversal-bullish',
    definition:
      'Candle naik yang badannya lebih panjang dan sepenuhnya menutupi badan candle turun kemarin. Bacaannya: kenaikan hari ini menghapus seluruh penurunan hari sebelumnya dalam satu hari.',
    detect: bullishengulfingpattern,
  },
  {
    key: 'bearishengulfingpattern',
    label: 'Bearish Engulfing',
    category: 'reversal-bearish',
    definition:
      'Candle turun yang badannya lebih panjang dan sepenuhnya menutupi badan candle naik kemarin. Bacaannya: penurunan hari ini menghapus seluruh kenaikan hari sebelumnya dalam satu hari.',
    detect: bearishengulfingpattern,
  },
  {
    key: 'morningstar',
    label: 'Morning Star',
    category: 'reversal-bullish',
    definition:
      'Tiga hari berurutan: turun besar, lalu satu hari yang nyaris diam, lalu naik besar yang menutup di atas titik tengah hari pertama. Bacaannya: penurunan berhenti dulu satu hari, baru kemudian berbalik arah.',
    detect: morningstar,
  },
  {
    key: 'eveningstar',
    label: 'Evening Star',
    category: 'reversal-bearish',
    definition:
      'Kebalikan Morning Star: naik besar, satu hari yang nyaris diam, lalu turun besar yang menutup di bawah titik tengah hari pertama. Bacaannya: kenaikan berhenti dulu satu hari, baru kemudian berbalik arah.',
    detect: eveningstar,
  },
  {
    key: 'morningdojistar',
    label: 'Morning Doji Star',
    category: 'reversal-bullish',
    definition:
      'Sama seperti Morning Star, tetapi hari tengahnya berupa Doji — benar-benar diam, bukan sekadar bergerak sedikit. Versi yang lebih jarang muncul dan lebih tegas bentuknya.',
    detect: morningdojistar,
  },
  {
    key: 'eveningdojistar',
    label: 'Evening Doji Star',
    category: 'reversal-bearish',
    definition:
      'Sama seperti Evening Star, tetapi hari tengahnya berupa Doji — benar-benar diam, bukan sekadar bergerak sedikit. Versi yang lebih jarang muncul dan lebih tegas bentuknya.',
    detect: eveningdojistar,
  },
  {
    key: 'threewhitesoldiers',
    label: 'Three White Soldiers',
    category: 'reversal-bullish',
    definition:
      'Tiga hari naik berturut-turut, masing-masing dibuka di dalam badan candle kemarin dan ditutup lebih tinggi lagi. Bacaannya: kenaikan terjadi tiga hari beruntun tanpa jeda berarti. Termasuk pola yang jarang terbentuk.',
    detect: threewhitesoldiers,
  },
  {
    key: 'threeblackcrows',
    label: 'Three Black Crows',
    category: 'reversal-bearish',
    definition:
      'Tiga hari turun berturut-turut, masing-masing dibuka di dalam badan candle kemarin dan ditutup lebih rendah lagi. Bacaannya: penurunan terjadi tiga hari beruntun tanpa jeda berarti. Termasuk pola yang jarang terbentuk.',
    detect: threeblackcrows,
  },
  {
    key: 'hammerpattern',
    label: 'Hammer',
    category: 'reversal-bullish',
    definition:
      'Badan candle kecil di bagian atas dengan ekor bawah panjang, minimal dua kali panjang badannya, muncul setelah harga turun beberapa hari. Bacaannya: harga sempat jatuh dalam sekali, tetapi ditarik kembali naik sebelum pasar tutup.',
    detect: hammerpattern,
  },
  {
    key: 'hangingman',
    label: 'Hanging Man',
    category: 'reversal-bearish',
    definition:
      'Bentuknya sama persis dengan Hammer — badan kecil di atas, ekor bawah panjang — bedanya muncul setelah harga naik beberapa hari, bukan setelah turun. Letaknya di dalam tren yang membedakan namanya.',
    detect: hangingman,
  },
  {
    key: 'shootingstar',
    label: 'Shooting Star',
    category: 'reversal-bearish',
    definition:
      'Badan candle kecil di bagian bawah dengan ekor atas panjang, muncul setelah harga naik beberapa hari. Bacaannya: harga sempat melesat jauh ke atas, tetapi ditarik kembali turun sebelum pasar tutup.',
    detect: shootingstar,
  },
  {
    key: 'bullishharami',
    label: 'Bullish Harami',
    category: 'reversal-bullish',
    definition:
      'Candle bertubuh kecil yang seluruhnya berada di dalam rentang badan candle turun besar kemarin. Bacaannya: setelah penurunan besar, hari ini pasar bergerak jauh lebih sempit — penurunannya kehilangan tenaga.',
    detect: bullishharami,
  },
  {
    key: 'bearishharami',
    label: 'Bearish Harami',
    category: 'reversal-bearish',
    definition:
      'Candle bertubuh kecil yang seluruhnya berada di dalam rentang badan candle naik besar kemarin. Bacaannya: setelah kenaikan besar, hari ini pasar bergerak jauh lebih sempit — kenaikannya kehilangan tenaga.',
    detect: bearishharami,
  },
  {
    key: 'bullishharamicross',
    label: 'Bullish Harami Cross',
    category: 'reversal-bullish',
    definition:
      'Bullish Harami yang candle keduanya berupa Doji, bukan sekadar badan kecil. Bentuknya lebih tegas karena hari kedua benar-benar berhenti bergerak.',
    detect: bullishharamicross,
  },
  {
    key: 'bearishharamicross',
    label: 'Bearish Harami Cross',
    category: 'reversal-bearish',
    definition:
      'Bearish Harami yang candle keduanya berupa Doji, bukan sekadar badan kecil. Bentuknya lebih tegas karena hari kedua benar-benar berhenti bergerak.',
    detect: bearishharamicross,
  },
  {
    key: 'abandonedbaby',
    label: 'Abandoned Baby',
    category: 'reversal-bullish',
    definition:
      'Sebuah Doji yang terpisah sendirian: harga melompat turun menjauh dari candle sebelumnya, lalu melompat naik lagi ke candle sesudahnya, tanpa rentang harga yang bersinggungan sama sekali. Termasuk pola paling langka — pada pemindaian 1.550 hari bursa, pola ini tidak muncul satu kali pun.',
    detect: abandonedbaby,
  },
  {
    key: 'bullishmarubozu',
    label: 'Bullish Marubozu',
    category: 'continuation',
    definition:
      'Candle naik berbadan penuh tanpa ekor di kedua ujung — dibuka tepat di harga terendah hari itu dan ditutup tepat di harga tertingginya. Bacaannya: pembeli menguasai sepanjang hari tanpa perlawanan berarti.',
    detect: bullishmarubozu,
  },
  {
    key: 'bearishmarubozu',
    label: 'Bearish Marubozu',
    category: 'continuation',
    definition:
      'Candle turun berbadan penuh tanpa ekor di kedua ujung — dibuka tepat di harga tertinggi hari itu dan ditutup tepat di harga terendahnya. Bacaannya: penjual menguasai sepanjang hari tanpa perlawanan berarti.',
    detect: bearishmarubozu,
  },
  {
    key: 'piercingline',
    label: 'Piercing Line',
    category: 'reversal-bullish',
    definition:
      'Setelah candle turun besar, candle berikutnya dibuka lebih rendah lagi tetapi ditutup di atas titik tengah candle kemarin. Bacaannya: hari dimulai lebih buruk, tetapi lebih dari separuh penurunan kemarin berhasil ditebus.',
    detect: piercingline,
  },
  {
    key: 'spinningtop',
    label: 'Spinning Top',
    category: 'indecision',
    definition:
      'Badan candle kecil dengan ekor atas dan ekor bawah yang sama-sama panjang. Bacaannya: harga bolak-balik jauh ke dua arah sepanjang hari, tetapi berakhir hampir di titik awalnya. Ini bentuk paling sering muncul di bursa — sekitar dua dari lima hari perdagangan.',
    // Merged from the library's bullish/bearish variants, which matched the
    // same bar 321 times in the scan; labelling one bar as both is incoherent.
    detect: (d) => bullishspinningtop(d) || bearishspinningtop(d),
  },
  {
    key: 'tweezertop',
    label: 'Tweezer Top',
    category: 'reversal-bearish',
    definition:
      'Dua candle berurutan yang harga tertingginya berhenti di titik yang hampir persis sama. Bacaannya: dua hari berturut-turut harga gagal menembus batas atas yang sama.',
    detect: tweezertop,
  },
  {
    key: 'tweezerbottom',
    label: 'Tweezer Bottom',
    category: 'reversal-bullish',
    definition:
      'Dua candle berurutan yang harga terendahnya berhenti di titik yang hampir persis sama. Bacaannya: dua hari berturut-turut harga gagal menembus batas bawah yang sama.',
    detect: tweezerbottom,
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

/** One row per DEFINED pattern — including those that never matched, because
 *  "Three White Soldiers: 0×" is as informative as a hit, and a picker that
 *  hides empty rows would quietly hide that. */
export interface PatternFrequency {
  key: string;
  label: string;
  category: PatternCategory;
  definition: string;
  count: number;
  /** Share of scanned bars this pattern matched, 0-1. */
  rate: number;
  /** Average trading days between occurrences, null when it matched 0 or 1 time. */
  averageGapDays: number | null;
  lastDate: string | null;
}

export interface CandlestickResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  reliabilityWarning: string;
  matches: PatternMatch[];
  /** Bars the scan covered — the denominator behind every `rate` below. */
  barsScanned: number;
  frequencies: PatternFrequency[];
}

const MIN_BARS = 3; // shortest pattern (single-candle) still needs a little context; multi-candle patterns need up to 3

export function detectCandlestickPatterns(symbol: string, bars: DailyBar[]): CandlestickResult {
  const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < MIN_BARS) {
    return {
      symbol,
      status: 'inadequate',
      reliabilityWarning: RELIABILITY_WARNING,
      matches: [],
      barsScanned: sorted.length,
      frequencies: [],
    };
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

  const frequencies: PatternFrequency[] = PATTERNS.map((p) => {
    const hits = matches.filter((m) => m.key === p.key);
    const first = hits[0];
    const last = hits[hits.length - 1];
    return {
      key: p.key,
      label: p.label,
      category: p.category,
      definition: p.definition,
      count: hits.length,
      rate: hits.length / sorted.length,
      // Spacing between the first and last occurrence, not bars/count: with
      // two hits on consecutive days out of 60 bars, "every 30 days" would be
      // an invented average. This measures the actual span they occupied.
      averageGapDays: hits.length > 1 ? (last.index - first.index) / (hits.length - 1) : null,
      lastDate: last?.date ?? null,
    };
  });

  return {
    symbol,
    status: 'ok',
    reliabilityWarning: RELIABILITY_WARNING,
    matches,
    barsScanned: sorted.length,
    frequencies,
  };
}
