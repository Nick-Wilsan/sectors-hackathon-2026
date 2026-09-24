import { getCompanyReport } from '../data/companyReport.js';
import { searchCompanies } from '../data/companies.js';
import { mapWithConcurrency } from '../data/slug.js';
import { computeCompositeScore, extractRatios, SCORE_COMPONENTS, type ComponentKey, type ComponentRatios, type CompositeScoreResult } from './score.js';

// F-02 Screener dengan Logika Kustom.
//
// Deliberately does NOT delegate filtering/sorting to the Sectors API's own
// `where`/`order_by` (PRD: "logika penyaringan merupakan logika milik tim").
// The Sectors screener is only used once, to list which symbols exist in a
// sub-sector — every filter/sort/rank on score or ratio values below is our
// own code, computed from data this app already fetched for F-01.

/**
 * How many companies of a sub-sector are fetched as its percentile group.
 * The ONE value every score surface must share — screener, detail page, peer
 * table, dashboard cards. Percentiles depend on who is in the group, so two
 * surfaces with different limits show the same emiten two different scores:
 * food-beverage has 102 members, and a limit of 100 used to drop two of them
 * from the screener while the detail page ranked against all 102.
 */
export const DEFAULT_GROUP_LIMIT = 150;

export interface ScoredCompany extends CompositeScoreResult {
  companyName: string;
}

/**
 * Computes composite scores for every company in one sub-sector, reusing a
 * single shared peer group instead of refetching it per symbol (as calling
 * getCompositeScoreForSymbol in a loop would) — one screener call + one
 * financials fetch per company, no matter how many companies are scored.
 */
export async function getScoredCompaniesInSubSector(
  subSectorSlug: string,
  options: { limit?: number } = {},
): Promise<{ companies: ScoredCompany[]; groupSize: number; fetchFailures: number }> {
  const listing = await searchCompanies({
    where: `sub_sector = '${subSectorSlug}'`,
    limit: options.limit ?? DEFAULT_GROUP_LIMIT,
  });

  // A null `ratios` used to mean two different things — the company genuinely
  // lacks the reported figures, or its report simply failed to download. Only
  // the first is a real finding; the second silently shrinks the percentile
  // group and shifts EVERY score in it, with nothing on screen to say so.
  // `fetchFailed` keeps them apart so callers can disclose the difference.
  const withRatios = await mapWithConcurrency(listing.items, 5, async (item) => {
    try {
      const report = await getCompanyReport(item.symbol, ['financials']);
      return { symbol: item.symbol, companyName: item.companyName, ratios: extractRatios(report.financials), fetchFailed: false };
    } catch {
      return { symbol: item.symbol, companyName: item.companyName, ratios: null as ComponentRatios | null, fetchFailed: true };
    }
  });

  const fetchFailures = withRatios.filter((c) => c.fetchFailed).length;

  const group: ComponentRatios[] = withRatios
    .map((c) => c.ratios)
    .filter((r): r is ComponentRatios => r !== null);

  const companies: ScoredCompany[] = withRatios.map((c) => ({
    ...computeCompositeScore(c.symbol, c.ratios, group),
    companyName: c.companyName,
  }));

  return { companies, groupSize: group.length, fetchFailures };
}

export interface ComponentRange {
  min?: number;
  max?: number;
}

export interface ScreenerParams {
  subSector: string;
  limit?: number;
  sortBy?: 'score' | ComponentKey;
  sortDirection?: 'asc' | 'desc';
  minScore?: number;
  maxScore?: number;
  /** Range filters on a component's raw ratio value (not its percentile). */
  componentFilters?: Partial<Record<ComponentKey, ComponentRange>>;
}

export interface ScreenerResult {
  subSector: string;
  groupSize: number;
  ranked: ScoredCompany[];
  /** Companies with >1 missing component — excluded from ranking, listed separately for transparency. */
  dataTidakMemadai: ScoredCompany[];
  /**
   * Peers whose financial report could not be downloaded at all. They are
   * absent from the percentile group, which shifts every score here, so this
   * count must reach the UI rather than be swallowed.
   */
  fetchFailures: number;
}

function rawValueOf(company: ScoredCompany, key: ComponentKey): number | undefined {
  return company.components.find((c) => c.key === key)?.rawValue;
}

function sortValueOf(company: ScoredCompany, sortBy: NonNullable<ScreenerParams['sortBy']>): number {
  if (sortBy === 'score') return company.score ?? -Infinity;
  const component = company.components.find((c) => c.key === sortBy);
  return component?.percentile ?? -Infinity;
}

/** Applies our own filter + sort logic on top of already-scored companies. */
export function screenCompanies(companies: ScoredCompany[], params: ScreenerParams, fetchFailures = 0): ScreenerResult {
  const dataTidakMemadai = companies.filter((c) => c.status === 'inadequate');
  let ranked = companies.filter((c) => c.status !== 'inadequate');

  if (params.minScore !== undefined) {
    ranked = ranked.filter((c) => (c.score ?? -Infinity) >= params.minScore!);
  }
  if (params.maxScore !== undefined) {
    ranked = ranked.filter((c) => (c.score ?? Infinity) <= params.maxScore!);
  }

  for (const key of SCORE_COMPONENTS.map((c) => c.key)) {
    const range = params.componentFilters?.[key];
    if (!range) continue;
    ranked = ranked.filter((c) => {
      const value = rawValueOf(c, key);
      if (value === undefined) return false;
      if (range.min !== undefined && value < range.min) return false;
      if (range.max !== undefined && value > range.max) return false;
      return true;
    });
  }

  const sortBy = params.sortBy ?? 'score';
  const direction = params.sortDirection ?? 'desc';
  ranked = [...ranked].sort((a, b) => {
    const diff = sortValueOf(a, sortBy) - sortValueOf(b, sortBy);
    return direction === 'desc' ? -diff : diff;
  });

  return { subSector: params.subSector, groupSize: companies.length, ranked, dataTidakMemadai, fetchFailures };
}
