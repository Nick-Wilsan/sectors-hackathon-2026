import { sectorsGet } from './sectorsClient.js';
import type { CompanyReport, CompanyReportSection, RawCompanyReport } from './types.js';

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
