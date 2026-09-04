import { getCompanyReport } from '../data/companyReport.js';
import { searchCompanies } from '../data/companies.js';
import { slugify, mapWithConcurrency } from '../data/slug.js';
import { computeCompositeScore, extractRatios, type ComponentRatios, type CompositeScoreResult } from './score.js';

export interface CompositeScoreOptions {
  /** Max peers to pull into the comparison group (bounds credit spend). */
  peerLimit?: number;
}

const DEFAULT_PEER_LIMIT = 50;

/**
 * Orchestrates the data fetches F-01 needs: the target's own report, its
 * sub-sector's peer list, and each peer's ratios — then hands everything to
 * the pure `computeCompositeScore`. All underlying calls are cached (see
 * src/data/cache.ts), so recomputing the same sub-sector within 24h is free.
 */
export async function getCompositeScoreForSymbol(
  symbol: string,
  options: CompositeScoreOptions = {},
): Promise<CompositeScoreResult> {
  const peerLimit = options.peerLimit ?? DEFAULT_PEER_LIMIT;

  const targetReport = await getCompanyReport(symbol, ['overview', 'financials']);
  const subSectorName = targetReport.overview?.sub_sector as string | undefined;

  if (!subSectorName) {
    return computeCompositeScore(symbol, null, []);
  }

  const subSectorSlug = slugify(subSectorName);

  const screenerResult = await searchCompanies({
    where: `sub_sector = '${subSectorSlug}'`,
    limit: peerLimit,
  });

  const peerSymbols = screenerResult.items.map((item) => item.symbol).filter((s) => s !== targetReport.symbol);

  const peerRatios = await mapWithConcurrency(peerSymbols, 5, async (peerSymbol) => {
    try {
      const report = await getCompanyReport(peerSymbol, ['financials']);
      return extractRatios(report.financials);
    } catch {
      // A single peer failing to fetch shouldn't block the whole computation —
      // it's simply excluded from the comparison group.
      return null;
    }
  });

  const targetRatios: ComponentRatios | null = extractRatios(targetReport.financials);
  const group: ComponentRatios[] = [targetRatios, ...peerRatios].filter((r): r is ComponentRatios => r !== null);

  return computeCompositeScore(targetReport.symbol, targetRatios, group);
}
