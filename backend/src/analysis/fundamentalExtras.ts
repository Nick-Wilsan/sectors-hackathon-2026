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
  pe_peer_avg: number | null;
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
}

export async function getFundamentalExtras(symbol: string): Promise<FundamentalExtras> {
  const report = await getCompanyReport(symbol, ['valuation', 'dividend', 'financials']);

  const valuationYears = (report.valuation?.historical_valuation as RawHistoricalValuationYear[] | undefined) ?? [];
  const latestValuation = [...valuationYears].sort((a, b) => b.year - a.year)[0];

  const dividend = report.dividend as { yield_ttm?: number | null } | undefined;
  const latestRatio = latestRatioYear(report.financials);

  return {
    symbol,
    year: latestValuation?.year ?? null,
    pe: latestValuation?.pe ?? null,
    pePeerAvg: latestValuation?.pe_peer_avg ?? null,
    pb: latestValuation?.pb ?? null,
    dividendYieldTtm: dividend?.yield_ttm ?? null,
    casaRatio: (latestRatio?.liquidity as Record<string, number | null> | undefined)?.casa_ratio ?? null,
    costToIncomeRatio: latestRatio?.profitability?.cost_to_income_ratio ?? null,
  };
}
