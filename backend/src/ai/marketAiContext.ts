import { getIndexDaily, getIdxTotal, getTopMoversToday, getMostTradedToday } from '../data/market.js';
import { recentRange } from '../data/dateRange.js';
import { getMarketAnomalyScan } from '../analysis/marketAnomalyScan.js';
import { glossaryAsContext } from './glossary.js';

// Dashboard-scope context for the AI assistant.
//
// The launcher on the dashboard used to be wired to a hardcoded BBCA, so it
// announced "Tanya AI · BBCA" on a page that is not about BBCA — and answered
// questions about the wrong thing. This builds the context the dashboard
// actually shows instead.
//
// Every source here is already fetched to paint the dashboard (/overview and
// /anomali), so opening the assistant costs no credit. Nothing is fetched that
// the page does not already display: the assistant explains what is on screen,
// it does not widen the data surface.

export interface MarketAiContext {
  cakupan: string;
  ihsg: { tanggalTerakhir: string | null; nilaiTerakhir: number | null; perubahanHarianPersen: number | null };
  kapitalisasiPasarBursa: { tanggal: string; nilai: number } | null;
  penggerakHariIni: {
    penguatanTerbesar: { symbol: string; companyName: string; perubahanPersen: number }[];
    pelemahanTerbesar: { symbol: string; companyName: string; perubahanPersen: number }[];
  };
  emitenTeramai: { symbol: string; companyName: string; volume: number; perubahanPersen: number | null }[];
  pemindaianAnomali: {
    ambangBatas: string;
    pergerakanIHSGSesiIniPersen: number | null;
    baris: {
      symbol: string;
      tidakBiasa: boolean;
      metrikTerpicu: { label: string; zScore: number }[];
      dibandingPasar: string | null;
    }[];
  };
  kamusIstilah: Record<string, string>;
  catatan: string;
}

/** Sectors mengirim perubahan harga sebagai desimal (0,0154 = 1,54%). Konteks
 *  AI mengirimkannya sudah dalam satuan persen dan dengan nama medan yang
 *  menyebut satuannya, supaya model tidak perlu menebak skalanya — pengujian
 *  awal menunjukkan model menulis "-0,0047%" untuk nilai -0,0047. */
function toPercent(value: number): number;
function toPercent(value: number | null): number | null;
function toPercent(value: number | null): number | null {
  return value === null ? null : Number((value * 100).toFixed(2));
}

function dailyChange(points: { date: string; price: number }[]): { date: string | null; last: number | null; change: number | null } {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  if (!last) return { date: null, last: null, change: null };
  return {
    date: last.date,
    last: last.price,
    change: prev && prev.price > 0 ? (last.price - prev.price) / prev.price : null,
  };
}

export async function buildMarketAiContext(): Promise<MarketAiContext> {
  const [ihsg, idxTotal, movers, mostTraded, anomalyScan] = await Promise.all([
    getIndexDaily('ihsg', recentRange(90)),
    getIdxTotal(recentRange(30)),
    getTopMoversToday(8),
    getMostTradedToday(8),
    getMarketAnomalyScan(),
  ]);

  const idx = dailyChange(ihsg);
  const lastCap = [...idxTotal].sort((a, b) => a.date.localeCompare(b.date)).pop() ?? null;

  return {
    cakupan:
      'Konteks ini adalah ringkasan pasar yang sedang ditampilkan di halaman dasbor. Tidak berisi data mendalam satu emiten tertentu.',
    ihsg: { tanggalTerakhir: idx.date, nilaiTerakhir: idx.last, perubahanHarianPersen: toPercent(idx.change) },
    kapitalisasiPasarBursa: lastCap ? { tanggal: lastCap.date, nilai: lastCap.marketCap } : null,
    penggerakHariIni: {
      penguatanTerbesar: movers.gainers.map((m) => ({ symbol: m.symbol, companyName: m.companyName, perubahanPersen: toPercent(m.priceChange) })),
      pelemahanTerbesar: movers.losers.map((m) => ({ symbol: m.symbol, companyName: m.companyName, perubahanPersen: toPercent(m.priceChange) })),
    },
    emitenTeramai: mostTraded.map((m) => ({
      symbol: m.symbol,
      companyName: m.companyName,
      volume: m.volume,
      perubahanPersen: toPercent(m.priceChange),
    })),
    pemindaianAnomali: {
      ambangBatas: `${anomalyScan.threshold} standar deviasi dari rata-rata baseline 90 hari`,
      pergerakanIHSGSesiIniPersen: toPercent(anomalyScan.marketReturn),
      baris: anomalyScan.rows.map((r) => ({
        symbol: r.symbol,
        tidakBiasa: r.hasAnomaly,
        metrikTerpicu: r.triggered.map((m) => ({ label: m.label, zScore: m.zScore })),
        dibandingPasar: r.marketContext?.statement ?? null,
      })),
    },
    kamusIstilah: glossaryAsContext(),
    catatan:
      'Seluruh angka di atas adalah harga penutupan harian (EOD), bukan harga real-time. Anomali adalah pernyataan statistik semata dan tidak menyatakan penyebab. ' +
      'Bila pengguna bertanya tentang satu emiten secara mendalam (skor, rasio, laporan keuangan), arahkan mereka membuka halaman emiten tersebut karena data itu tidak tersedia pada konteks ini.',
  };
}

/** Extra rules that apply only to the dashboard scope. */
export const MARKET_SCOPE_INSTRUCTION = `
Konteks yang diberikan adalah ringkasan pasar di halaman dasbor, bukan analisis mendalam satu emiten.
Bila pertanyaan menuntut data yang tidak ada pada konteks (misalnya rasio keuangan atau skor satu emiten),
nyatakan bahwa data itu tidak tersedia di halaman ini dan sarankan membuka halaman emiten yang bersangkutan.
Jangan menyusun daftar saham pilihan, peringkat rekomendasi, atau saran menyusun portofolio dalam bentuk apa pun.
`.trim();
