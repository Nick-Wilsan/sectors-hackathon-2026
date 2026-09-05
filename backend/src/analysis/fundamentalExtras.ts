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

interface RawHistoricalFinancialYear {
  year: number;
  revenue: number | null;
  earnings: number | null;
  ebitda: number | null;
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

/** Revenue/earnings history, used for a factual growth read rather than a projection. */
export interface FinancialYear {
  year: number;
  revenue: number | null;
  earnings: number | null;
  ebitda: number | null;
}

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
  /** Revenue/earnings/EBITDA per year, oldest first. */
  historicalFinancials: FinancialYear[];
  lastClosePrice: number | null;
  latestCloseDate: string | null;
  dailyCloseChange: number | null;
}

export async function getFundamentalExtras(symbol: string): Promise<FundamentalExtras> {
  const report = await getCompanyReport(symbol, ['valuation', 'dividend', 'financials']);

  const valuationYears = (report.valuation?.historical_valuation as RawHistoricalValuationYear[] | undefined) ?? [];
  const latestValuation = [...valuationYears].sort((a, b) => b.year - a.year)[0];

  const dividend = report.dividend as { yield_ttm?: number | null } | undefined;
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
    dividendYieldTtm: dividend?.yield_ttm ?? null,
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
    historicalFinancials: [...financialYears]
      .sort((a, b) => a.year - b.year)
      .map((f) => ({ year: f.year, revenue: f.revenue ?? null, earnings: f.earnings ?? null, ebitda: f.ebitda ?? null })),
    lastClosePrice: valuationSection?.last_close_price ?? null,
    latestCloseDate: valuationSection?.latest_close_date ?? null,
    dailyCloseChange: valuationSection?.daily_close_change ?? null,
  };
}
