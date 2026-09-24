import { getScoredCompaniesInSubSector, DEFAULT_GROUP_LIMIT } from './screener.js';

// Dashboard "sorotan sub-sektor" cards. Not a PRD feature on its own — it
// reuses F-01's already-locked composite score formula (see score.ts) across
// a small, fixed set of well-known sub-sectors, purely so the dashboard has
// real numbers instead of the decorative/fabricated per-sector stats in the
// design mockup (which assumed data — foreign flow, "Skor Sektor 86/100" for
// arbitrary sectors — the Sectors API does not expose).
//
// Each card scores the WHOLE sub-sector, with the same group limit as the
// screener and detail page. It used to stop at the first 12 companies to save
// credits, which made every percentile on the card relative to an arbitrary
// dozen: the "top leader" of banks was the best of 12 out of 48, with a score
// that did not match the one on its own page. Reports are cached 30 days and
// shared with the screener, so the full group costs little after first load.
const CURATED_SUBSECTORS = [
  { sector: 'financials', subsector: 'banks', label: 'Perbankan' },
  { sector: 'energy', subsector: 'oil-gas-coal', label: 'Energi & Tambang' },
  { sector: 'consumer-non-cyclicals', subsector: 'food-beverage', label: 'Makanan & Minuman' },
  { sector: 'healthcare', subsector: 'pharmaceuticals-health-care-research', label: 'Kesehatan & Farmasi' },
  { sector: 'infrastructures', subsector: 'telecommunication', label: 'Telekomunikasi' },
  { sector: 'technology', subsector: 'software-it-services', label: 'Teknologi' },
] as const;

export interface SectorSpotlightCompanyRef {
  symbol: string;
  companyName: string;
  score: number;
}

export interface SectorSpotlightCard {
  sector: string;
  subsector: string;
  label: string;
  groupSize: number;
  /** Companies scored 'ok'/'partial' (excludes 'inadequate'). */
  scoredCount: number;
  /** Score >= 66 (see ScoreBar's tier convention). */
  healthyCount: number;
  /** Score < 33. */
  criticalCount: number;
  topCompany: SectorSpotlightCompanyRef | null;
  laggardCompany: SectorSpotlightCompanyRef | null;
}

export async function getSectorSpotlight(): Promise<SectorSpotlightCard[]> {
  return Promise.all(
    CURATED_SUBSECTORS.map(async (c): Promise<SectorSpotlightCard> => {
      const { companies, groupSize } = await getScoredCompaniesInSubSector(c.subsector, { limit: DEFAULT_GROUP_LIMIT });

      const ranked = companies
        .filter((co): co is typeof co & { score: number } => co.status !== 'inadequate' && co.score !== null)
        .sort((a, b) => b.score - a.score);

      const top = ranked[0];
      const laggard = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

      return {
        sector: c.sector,
        subsector: c.subsector,
        label: c.label,
        groupSize,
        scoredCount: ranked.length,
        // NOTE: a plain average of percentile-rank scores across the very
        // group those percentiles are computed from is mathematically
        // guaranteed to land near 50 for every sub-sector — it would look
        // like real data while conveying nothing. These counts (how many
        // companies clear/miss the same 66/33 thresholds ScoreBar uses)
        // are the version of "how healthy is this sub-sector" that's
        // actually informative.
        healthyCount: ranked.filter((co) => co.score >= 66).length,
        criticalCount: ranked.filter((co) => co.score < 33).length,
        topCompany: top ? { symbol: top.symbol, companyName: top.companyName, score: top.score } : null,
        laggardCompany: laggard ? { symbol: laggard.symbol, companyName: laggard.companyName, score: laggard.score } : null,
      };
    }),
  );
}
