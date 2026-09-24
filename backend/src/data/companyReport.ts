import { sectorsGet } from './sectorsClient.js';
import { DAILY_TTL_MS, DEFAULT_TTL_MS } from './cache.js';
import type { CompanyReport, CompanyReportSection, RawCompanyReport } from './types.js';

// Sections carrying the last close and ratios built on it (market cap, P/E,
// PBV). Under the 30-day default the BBCA identity card said Rp 6.700 "per
// 2026-09-04" on 24 Sep, beneath a ticker already showing the 23 Sep close.
// The remaining sections are annual/quarterly and keep the long TTL.
const PRICE_BEARING_SECTIONS: ReadonlySet<CompanyReportSection> = new Set(['overview', 'valuation']);

/**
 * E-02: Company Report (1 credit per requested section).
 * `sections` is required (no "fetch everything" default) so every call site
 * makes a conscious credit-cost decision instead of accidentally spending 8.
 */
export async function getCompanyReport(
  symbol: string,
  sections: CompanyReportSection[],
): Promise<CompanyReport> {
  if (sections.length === 0) {
    throw new Error('getCompanyReport requires at least one section');
  }

  const raw = await sectorsGet<RawCompanyReport>(`/v2/company/report/${encodeURIComponent(symbol)}/`, {
    params: { sections: sections.join(',') },
    cacheTtlMs: sections.some((s) => PRICE_BEARING_SECTIONS.has(s)) ? DAILY_TTL_MS : DEFAULT_TTL_MS,
  });

  return {
    symbol: raw.symbol,
    companyName: raw.company_name,
    sections,
    overview: raw.overview,
    valuation: raw.valuation,
    future: raw.future,
    financials: raw.financials,
    dividend: raw.dividend,
    management: raw.management,
    ownership: raw.ownership,
    peers: raw.peers,
    fetchedAt: new Date().toISOString(),
  };
}
