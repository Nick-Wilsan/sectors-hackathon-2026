import { getCompanyReport } from '../data/companyReport.js';
import { slugify } from '../data/slug.js';
import { getScoredCompaniesInSubSector, DEFAULT_GROUP_LIMIT } from './screener.js';
import type { ComponentScoreDetail, CompositeScoreResult } from './score.js';

// F-03 Perbandingan Peer dan Sektor.
// Reuses the F-01/F-02 scoring engine (same sub-sector group, same percentile
// math) rather than recomputing anything — PRD kriteria selesai: kelompok
// pembanding otomatis, jumlah anggota ditampilkan, persentil untuk minimal
// 3 metrik (we expose all 5 composite-score components).

export interface PeerListEntry {
  symbol: string;
  companyName: string;
  score: number | null;
  status: CompositeScoreResult['status'];
}

export interface PeerComparisonResult {
  symbol: string;
  companyName: string;
  subSector: string;
  subSectorSlug: string;
  groupSize: number;
  status: CompositeScoreResult['status'];
  /** Percentile position on each metric — see score.ts SCORE_COMPONENTS for definitions. */
  metrics: ComponentScoreDetail[];
  peers: PeerListEntry[];
  /** Peers whose report failed to download and are therefore missing from the percentile group. */
  fetchFailures: number;
}

export async function getPeerComparison(symbol: string, options: { limit?: number } = {}): Promise<PeerComparisonResult> {
  const limit = options.limit ?? DEFAULT_GROUP_LIMIT;

  const overviewReport = await getCompanyReport(symbol, ['overview']);
  const subSectorName = overviewReport.overview?.sub_sector as string | undefined;

  if (!subSectorName) {
    return {
      symbol: overviewReport.symbol,
      companyName: overviewReport.companyName,
      subSector: '',
      subSectorSlug: '',
      groupSize: 0,
      status: 'inadequate',
      metrics: [],
      peers: [],
      fetchFailures: 0,
    };
  }

  const subSectorSlug = slugify(subSectorName);
  const { companies, fetchFailures } = await getScoredCompaniesInSubSector(subSectorSlug, { limit });

  const target = companies.find((c) => c.symbol === overviewReport.symbol);
  if (!target) {
    throw new Error(
      `${overviewReport.symbol} tidak ditemukan dalam ${companies.length} emiten sub-sektor "${subSectorSlug}" yang diambil (limit=${limit}). Naikkan limit.`,
    );
  }

  return {
    symbol: target.symbol,
    companyName: target.companyName,
    subSector: subSectorName,
    subSectorSlug,
    groupSize: companies.length,
    status: target.status,
    metrics: target.components,
    peers: companies.map((c) => ({ symbol: c.symbol, companyName: c.companyName, score: c.score, status: c.status })),
    fetchFailures,
  };
}
