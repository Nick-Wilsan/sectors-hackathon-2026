import { getCompanyReport } from '../data/companyReport.js';
import { latestRatioYear } from './score.js';

// Real per-company valuation/dividend/liquidity fields the Sectors API does
// expose but weren't wired into any endpoint yet — added after a user asked
// why the dashboard couldn't show P/E, PBV, Dividend Yield, or CASA Ratio
// like the reference mockup. Confirmed present (checked the live API
// response directly, all 5 years) before writing this: NPL Gross specifically
// is NOT one of them (no such field anywhere in historical_financial_ratio),
// so that one is still genuinely unavailable.

interface RawHistoricalValuationYear {
  year: number;
  pe: number | null;
  pb: number | null;
  ps: number | null;
  pcf: number | null;
  peg: number | null;
  pe_peer_avg: number | null;
  pb_peer_avg: number | null;
  ps_peer_avg: number | null;
}

// Sectors mengirim 67 medan laporan keuangan per tahun; yang dipakai hanya
// tiga. Daftar di bawah memilih medan yang membentuk tiga laporan baku, dan
// sengaja memuat medan khas bank maupun non-bank sekaligus — komponen tampilan
// yang menyaring baris kosong, sehingga bank menampilkan barisnya sendiri dan
// perusahaan biasa menampilkan miliknya, tanpa baris berisi strip.
export const STATEMENT_FIELDS = [
  'revenue', 'cost_of_revenue', 'gross_profit', 'operating_expense', 'operating_pnl',
  'ebit', 'ebitda', 'interest_income', 'interest_expense', 'net_interest_income',
  'non_interest_income', 'earnings_before_tax', 'tax', 'earnings',
  'total_assets', 'current_assets', 'fixed_assets', 'inventories', 'gross_loan', 'net_loan',
  'total_liabilities', 'current_liabilities', 'non_current_liabilities', 'total_deposit',
  'total_equity', 'retained_earnings', 'total_debt', 'net_debt', 'long_term_debt',
  'cash_only', 'cash_and_equivalents',
  'operating_cash_flow', 'investing_cash_flow', 'financing_cash_flow', 'net_cash_flow',
  'free_cash_flow', 'capital_expenditure', 'outstanding_shares',
] as const;

export type StatementField = (typeof STATEMENT_FIELDS)[number];

type RawHistoricalFinancialYear = { year: number } & Partial<Record<StatementField, number | null>>;

interface RawDividendYear {
  total_dividend?: number | null;
  total_yield?: number | null;
  breakdown?: { date: string; total?: number | null; yield?: number | null }[] | null;
}

/** Satu tahun pembagian dividen beserta rinciannya. */
export interface DividendYear {
  year: string;
  totalDividend: number | null;
  totalYield: number | null;
  breakdown: { date: string; total: number | null; yield: number | null }[];
}

/** One year of the emiten's multiples beside the peer-group average for that same year. */
export interface ValuationYear {
  year: number;
  pe: number | null;
  pePeerAvg: number | null;
  pb: number | null;
  pbPeerAvg: number | null;
  ps: number | null;
  psPeerAvg: number | null;
  pcf: number | null;
  peg: number | null;
}

/** Satu tahun laporan keuangan. Medan yang tidak dilaporkan emiten bernilai null. */
export type FinancialYear = { year: number } & Partial<Record<StatementField, number | null>>;

export interface FundamentalExtras {
  symbol: string;
  year: number | null;
  pe: number | null;
  pePeerAvg: number | null;
  pb: number | null;
  /** Trailing-twelve-month dividend yield (fraction, e.g. 0.0569 = 5.69%). */
  dividendYieldTtm: number | null;
  /** CASA ratio (fraction) — only meaningful for banks; null for other sectors (field absent). */
  casaRatio: number | null;
  /** Cost-to-income ratio (fraction) — real substitute for NPL Gross, which the API doesn't provide at all. */
  costToIncomeRatio: number | null;
  /** Full multiples history with per-year peer averages. Same cached report as the fields above — no extra credit. */
  historicalValuation: ValuationYear[];
  /** Laporan keuangan per tahun, terlama dulu. Medan tak dilaporkan bernilai null. */
  historicalFinancials: FinancialYear[];
  /** Riwayat dividen per tahun, terbaru dulu. */
  dividendHistory: DividendYear[];
  dividendTtm: number | null;
  /** Bagian laba yang dibagikan sebagai dividen (pecahan). */
  payoutRatio: number | null;
  dividendYieldAvg: number | null;
  /** Jumlah tahun yang dirata-ratakan pada dividendYieldAvg. */
  dividendYieldAvgPeriod: number | null;
  lastExDividendDate: string | null;
  lastClosePrice: number | null;
  latestCloseDate: string | null;
  dailyCloseChange: number | null;
}

export async function getFundamentalExtras(symbol: string): Promise<FundamentalExtras> {
  // Two requests, not one: valuation carries the daily close and refreshes
  // daily, while dividend and financials are annual and stay cached for weeks.
  // One combined URL would re-buy all three sections every day. The valuation
  // URL is also the one the dashboard's valuation panel uses, so they share cache.
  const [valuationReport, annualReport] = await Promise.all([
    getCompanyReport(symbol, ['valuation']),
    getCompanyReport(symbol, ['dividend', 'financials']),
  ]);
  const report = { ...annualReport, valuation: valuationReport.valuation };

  const valuationYears = (report.valuation?.historical_valuation as RawHistoricalValuationYear[] | undefined) ?? [];
  const latestValuation = [...valuationYears].sort((a, b) => b.year - a.year)[0];

  const dividendSection = report.dividend as
    | {
        yield_ttm?: number | null;
        dividend_ttm?: number | null;
        payout_ratio?: number | null;
        last_ex_dividend_date?: string | null;
        dividend_yield_avg?: { period?: number | null; avg_yield?: number | null } | null;
        historical_dividends?: Record<string, RawDividendYear | null> | null;
      }
    | undefined;
  const rawDividendHistory = dividendSection?.historical_dividends ?? {};
  const latestRatio = latestRatioYear(report.financials);

  const valuationSection = report.valuation as
    | { last_close_price?: number | null; latest_close_date?: string | null; daily_close_change?: number | null }
    | undefined;

  const financialYears = (report.financials?.historical_financials as RawHistoricalFinancialYear[] | undefined) ?? [];

  return {
    symbol,
    year: latestValuation?.year ?? null,
    pe: latestValuation?.pe ?? null,
    pePeerAvg: latestValuation?.pe_peer_avg ?? null,
    pb: latestValuation?.pb ?? null,
    dividendYieldTtm: dividendSection?.yield_ttm ?? null,
    casaRatio: (latestRatio?.liquidity as Record<string, number | null> | undefined)?.casa_ratio ?? null,
    costToIncomeRatio: latestRatio?.profitability?.cost_to_income_ratio ?? null,
    historicalValuation: [...valuationYears]
      .sort((a, b) => a.year - b.year)
      .map((v) => ({
        year: v.year,
        pe: v.pe ?? null,
        pePeerAvg: v.pe_peer_avg ?? null,
        pb: v.pb ?? null,
        pbPeerAvg: v.pb_peer_avg ?? null,
        ps: v.ps ?? null,
        psPeerAvg: v.ps_peer_avg ?? null,
        pcf: v.pcf ?? null,
        peg: v.peg ?? null,
      })),
    historicalFinancials: [...financialYears].sort((a, b) => a.year - b.year).map((f) => {
      const row: FinancialYear = { year: f.year };
      for (const key of STATEMENT_FIELDS) row[key] = f[key] ?? null;
      return row;
    }),
    dividendHistory: Object.entries(rawDividendHistory)
      .map(([year, d]) => ({
        year,
        totalDividend: d?.total_dividend ?? null,
        totalYield: d?.total_yield ?? null,
        breakdown: (d?.breakdown ?? []).map((b) => ({ date: b.date, total: b.total ?? null, yield: b.yield ?? null })),
      }))
      .sort((a, b) => b.year.localeCompare(a.year)),
    dividendTtm: dividendSection?.dividend_ttm ?? null,
    payoutRatio: dividendSection?.payout_ratio ?? null,
    dividendYieldAvg: dividendSection?.dividend_yield_avg?.avg_yield ?? null,
    dividendYieldAvgPeriod: dividendSection?.dividend_yield_avg?.period ?? null,
    lastExDividendDate: dividendSection?.last_ex_dividend_date ?? null,
    lastClosePrice: valuationSection?.last_close_price ?? null,
    latestCloseDate: valuationSection?.latest_close_date ?? null,
    dailyCloseChange: valuationSection?.daily_close_change ?? null,
  };
}
