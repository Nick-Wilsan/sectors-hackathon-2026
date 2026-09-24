import { getDailySeries } from '../data/transactions.js';
import { recentRange } from '../data/dateRange.js';
import { mapWithConcurrency } from '../data/slug.js';
import { getPeerComparison } from './peerComparison.js';
import { computePatternSimilarity, type CandidateSeries, type PatternSimilarityResult } from './patternSimilarity.js';

const DEFAULT_CANDIDATE_LIMIT = 15;
const PEER_HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PatternSimilarityOptions {
  /** Bounds how many peer companies' price history get fetched (credit cost). */
  candidateLimit?: number;
}

/**
 * F-09: reuses the F-03 peer group (same sub-sector, already cached from
 * scoring) purely as the candidate pool — new cost is only each peer's daily
 * price series, capped by candidateLimit.
 */
export async function getPatternSimilarity(
  symbol: string,
  options: PatternSimilarityOptions = {},
): Promise<PatternSimilarityResult> {
  const candidateLimit = options.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT;

  const [targetSeries, peer] = await Promise.all([
    getDailySeries(symbol, recentRange(90)),
    getPeerComparison(symbol),
  ]);

  // `peer.symbol` is the API-resolved canonical form (e.g. "BBCA.JK"); the raw
  // `symbol` param / targetSeries.symbol may be the shorthand the caller passed
  // (e.g. "BBCA") — compare against peer.symbol so self-comparison is actually excluded.
  const candidatePeers = peer.peers.filter((p) => p.symbol !== peer.symbol).slice(0, candidateLimit);

  const candidates = await mapWithConcurrency(candidatePeers, 5, async (p): Promise<CandidateSeries | null> => {
    try {
      // Peers are searched for HISTORICAL look-alike windows, so a series a few
      // days old serves as well as today's. A daily TTL here would re-buy up to
      // 15 peer series per emiten every day for no visible difference.
      const series = await getDailySeries(p.symbol, recentRange(90), PEER_HISTORY_TTL_MS);
      return { symbol: p.symbol, companyName: p.companyName, bars: series.bars };
    } catch {
      return null;
    }
  });

  const validCandidates = candidates.filter((c): c is CandidateSeries => c !== null);

  return computePatternSimilarity({ symbol: targetSeries.symbol, bars: targetSeries.bars }, validCandidates);
}
