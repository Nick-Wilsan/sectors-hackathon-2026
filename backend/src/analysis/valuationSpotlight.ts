import { getCompanyReport } from '../data/companyReport.js';
import { getTopMoversToday } from '../data/market.js';
import { mapWithConcurrency } from '../data/slug.js';

// Dashboard "valuasi vs rata-rata peer" panel. Replaces the design mockup's
// fabricated "P/E vs Avg 5 Thn" sector stat (the Sectors API has no sector-
// level valuation aggregate) with a real per-company figure the API does
// expose: `historical_valuation[].pe` alongside `pe_peer_avg` for the same
// year, from the company report's `valuation` section (1 credit/company,
// cached 24h). Deliberately descriptive, not evaluative — "di atas/bawah
// rata-rata peer", never "murah"/"mahal"/"beli"/"jual" (PRD B-02).

interface RawHistoricalValuationYear {
  year: number;
  pe: number | null;
  pe_peer_avg: number | null;
}

export interface ValuationSpotlightRow {
  symbol: string;
  companyName: string;
  year: number | null;
  pe: number | null;
  pePeerAvg: number | null;
  /** How this company's P/E compares to its peer group average for the same year — descriptive only. */
  relativeToPeers: 'below-average' | 'in-line' | 'above-average' | 'unknown';
}

function classify(pe: number | null, peerAvg: number | null): ValuationSpotlightRow['relativeToPeers'] {
  if (pe === null || peerAvg === null || peerAvg === 0) return 'unknown';
  const ratio = pe / peerAvg;
  if (ratio < 0.9) return 'below-average';
  if (ratio > 1.1) return 'above-average';
  return 'in-line';
}

async function getValuationForSymbol(symbol: string, companyName: string): Promise<ValuationSpotlightRow> {
  try {
    const report = await getCompanyReport(symbol, ['valuation']);
    const years = (report.valuation?.historical_valuation as RawHistoricalValuationYear[] | undefined) ?? [];
    const latest = [...years].sort((a, b) => b.year - a.year)[0];
    if (!latest) return { symbol, companyName, year: null, pe: null, pePeerAvg: null, relativeToPeers: 'unknown' };

    return {
      symbol,
      companyName,
      year: latest.year,
      pe: latest.pe,
      pePeerAvg: latest.pe_peer_avg,
      relativeToPeers: classify(latest.pe, latest.pe_peer_avg),
    };
  } catch {
    return { symbol, companyName, year: null, pe: null, pePeerAvg: null, relativeToPeers: 'unknown' };
  }
}

/** Valuation snapshot for today's top N gainers — reuses data already being fetched for the movers widget instead of a separate fixed watchlist. */
export async function getValuationSpotlight(nCompanies = 4): Promise<ValuationSpotlightRow[]> {
  const { gainers } = await getTopMoversToday(nCompanies);
  const targets = gainers.slice(0, nCompanies);
  return mapWithConcurrency(targets, 4, (m) => getValuationForSymbol(m.symbol, m.companyName));
}
