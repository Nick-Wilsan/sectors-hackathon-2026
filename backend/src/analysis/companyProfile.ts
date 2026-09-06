import { getCompanyReport } from '../data/companyReport.js';

// Profil perusahaan dari section `overview`.
//
// Section ini SUDAH diambil untuk setiap emiten yang diberi skor
// (scoreService memanggil getCompanyReport(symbol, ['overview']) untuk
// menentukan sub-sektornya), dan cache berkunci URL penuh. Modul ini memanggil
// dengan daftar section yang persis sama, sehingga selalu mengenai cache yang
// sudah ada dan berbiaya nol kredit.
//
// Menambahkan 'overview' ke dalam getFundamentalExtras akan menghasilkan URL
// berbeda — dan karena Sectors menagih satu kredit per section, itu justru
// membuat tiap halaman emiten membayar satu kredit ekstra selamanya.

interface RawPriceLevel {
  [date: string]: number;
}

interface RawOverview {
  listing_board?: string | null;
  industry?: string | null;
  sub_industry?: string | null;
  sector?: string | null;
  sub_sector?: string | null;
  market_cap?: number | null;
  market_cap_rank?: number | null;
  address?: string | null;
  employee_num?: number | null;
  employee_num_rank?: number | null;
  listing_date?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  all_time_price?: Record<string, RawPriceLevel> | null;
}

/** Satu titik harga ekstrem beserta tanggal terjadinya. */
export interface PriceExtreme {
  label: string;
  price: number;
  date: string;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  listingBoard: string | null;
  sector: string | null;
  subSector: string | null;
  industry: string | null;
  subIndustry: string | null;
  marketCap: number | null;
  /** Peringkat kapitalisasi di seluruh bursa; 1 berarti terbesar. */
  marketCapRank: number | null;
  address: string | null;
  employeeNum: number | null;
  employeeNumRank: number | null;
  listingDate: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  /** Titik tertinggi dan terendah pada beberapa rentang waktu. */
  priceExtremes: PriceExtreme[];
  fetchedAt: string;
}

// Nama rentang dari Sectors dialihbahasakan sekali di sini agar komponen
// tampilan tidak perlu memetakannya ulang.
const EXTREME_LABELS: Record<string, string> = {
  '90_d_low': 'Terendah 90 hari',
  '90_d_high': 'Tertinggi 90 hari',
  ytd_low: 'Terendah tahun berjalan',
  ytd_high: 'Tertinggi tahun berjalan',
  '52_w_low': 'Terendah 52 minggu',
  '52_w_high': 'Tertinggi 52 minggu',
  all_time_low: 'Terendah sepanjang masa',
  all_time_high: 'Tertinggi sepanjang masa',
};

const EXTREME_ORDER = ['90_d_low', '90_d_high', 'ytd_low', 'ytd_high', '52_w_low', '52_w_high', 'all_time_low', 'all_time_high'];

function toExtremes(raw: Record<string, RawPriceLevel> | null | undefined): PriceExtreme[] {
  const out: PriceExtreme[] = [];
  for (const key of EXTREME_ORDER) {
    const entry = raw?.[key];
    if (!entry) continue;
    // Bentuknya { "2026-06-09": 4820 } — satu pasang tanggal dan harga.
    const [date, price] = Object.entries(entry)[0] ?? [];
    if (date === undefined || typeof price !== 'number') continue;
    out.push({ label: EXTREME_LABELS[key] ?? key, price, date });
  }
  return out;
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile> {
  const report = await getCompanyReport(symbol, ['overview']);
  const o = (report.overview ?? {}) as RawOverview;

  return {
    symbol: report.symbol,
    companyName: report.companyName,
    listingBoard: o.listing_board ?? null,
    sector: o.sector ?? null,
    subSector: o.sub_sector ?? null,
    industry: o.industry ?? null,
    subIndustry: o.sub_industry ?? null,
    marketCap: o.market_cap ?? null,
    marketCapRank: o.market_cap_rank ?? null,
    address: o.address ?? null,
    employeeNum: o.employee_num ?? null,
    employeeNumRank: o.employee_num_rank ?? null,
    listingDate: o.listing_date ?? null,
    website: o.website ?? null,
    email: o.email ?? null,
    phone: o.phone ?? null,
    priceExtremes: toExtremes(o.all_time_price),
    fetchedAt: new Date().toISOString(),
  };
}
