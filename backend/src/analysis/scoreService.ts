import { getCompanyReport } from '../data/companyReport.js';
import { slugify } from '../data/slug.js';
import { getScoredCompaniesInSubSector } from './screener.js';
import { SCORE_COMPONENTS, type CompositeScoreResult } from './score.js';

export interface CompositeScoreOptions {
  /** Max companies to pull into the comparison group (bounds credit spend). */
  peerLimit?: number;
}

// Empirically, IDX sub-sectors top out well under 100 companies (Banks, one
// of the largest, has 48) — 150 leaves headroom while still bounding cost.
const DEFAULT_GROUP_LIMIT = 150;

/**
 * Single source of truth for "what is this company's composite score."
 * Delegates to getScoredCompaniesInSubSector (F-02's screener engine) so a
 * company's score on its own detail page is always identical to its score
 * in screener results — same peer group, same computation, no duplicated logic.
 *
 * PRD F-02 kriteria selesai: "hasil penyaringan konsisten dengan skor yang
 * ditampilkan pada halaman detail emiten."
 */
export async function getCompositeScoreForSymbol(
  symbol: string,
  options: CompositeScoreOptions = {},
): Promise<CompositeScoreResult> {
  const limit = options.peerLimit ?? DEFAULT_GROUP_LIMIT;

  const overviewReport = await getCompanyReport(symbol, ['overview']);
  const subSectorName = overviewReport.overview?.sub_sector as string | undefined;

  const inadequate = (): CompositeScoreResult => ({
    symbol: overviewReport.symbol,
    status: 'inadequate',
    score: null,
    year: null,
    components: [],
    missingComponents: SCORE_COMPONENTS.map((c) => c.key),
  });

  if (!subSectorName) return inadequate();

  const subSectorSlug = slugify(subSectorName);
  const { companies } = await getScoredCompaniesInSubSector(subSectorSlug, { limit });

  const match = companies.find((c) => c.symbol === overviewReport.symbol);
  if (!match) {
    // Sub-sector has more companies than `limit` and the target fell outside
    // the fetched page. Rare given DEFAULT_GROUP_LIMIT; surface it explicitly
    // rather than silently diverging from the screener's peer group.
    throw new Error(
      `${overviewReport.symbol} tidak ditemukan dalam ${companies.length} emiten sub-sektor "${subSectorSlug}" yang diambil (limit=${limit}). Naikkan peerLimit.`,
    );
  }

  return match;
}
