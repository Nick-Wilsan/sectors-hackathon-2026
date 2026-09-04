// Mirrors backend/src/analysis/score.ts and related response shapes.
// Kept as a hand-written subset (not generated) — small enough to maintain
// manually, and avoids a build-time dependency between the two packages.

export type ComponentKey = 'roe' | 'roa' | 'netProfitMargin' | 'der' | 'ocfMargin';

export interface ComponentScoreDetail {
  key: ComponentKey;
  label: string;
  rawValue: number;
  percentile: number;
  weightUsed: number;
  groupSize: number;
  groupSizeAdequate: boolean;
}

export type ScoreStatus = 'ok' | 'partial' | 'inadequate';

export interface CompositeScoreResult {
  symbol: string;
  status: ScoreStatus;
  score: number | null;
  year: string | null;
  components: ComponentScoreDetail[];
  missingComponents: ComponentKey[];
}

export interface ScoredCompany extends CompositeScoreResult {
  companyName: string;
}

export interface ScreenerResult {
  subSector: string;
  groupSize: number;
  ranked: ScoredCompany[];
  dataTidakMemadai: ScoredCompany[];
}

export interface PeerListEntry {
  symbol: string;
  companyName: string;
  score: number | null;
  status: ScoreStatus;
}

export interface PeerComparisonResult {
  symbol: string;
  companyName: string;
  subSector: string;
  subSectorSlug: string;
  groupSize: number;
  status: ScoreStatus;
  metrics: ComponentScoreDetail[];
  peers: PeerListEntry[];
}

export interface SubsectorOption {
  sector: string;
  subsector: string;
  label: string;
}
