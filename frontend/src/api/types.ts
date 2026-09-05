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

/** Composite score for one emiten, plus how many peers were missing when it was computed. */
export type CompositeScoreWithPeers = CompositeScoreResult & { peerFetchFailures: number };

export interface ScreenerResult {
  subSector: string;
  groupSize: number;
  ranked: ScoredCompany[];
  dataTidakMemadai: ScoredCompany[];
  /** Peers whose report failed to download — they are absent from the percentile group. */
  fetchFailures: number;
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
  fetchFailures: number;
}

export interface SubsectorOption {
  sector: string;
  subsector: string;
  label: string;
}

export interface DailyBar {
  symbol: string;
  date: string;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number;
  marketCap: number;
}

export interface DailySeries {
  symbol: string;
  bars: DailyBar[];
}

export type PatternCategory = 'reversal-bullish' | 'reversal-bearish' | 'indecision';

export interface PatternMatch {
  key: string;
  label: string;
  category: PatternCategory;
  definition: string;
  date: string;
  index: number;
}

export interface CandlestickResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  reliabilityWarning: string;
  matches: PatternMatch[];
}

export interface CompanyLite {
  symbol: string;
  companyName: string;
}

export interface NewsArticleFull {
  title: string;
  body?: string;
  source: string;
  timestamp: string;
  sector?: string;
  subSector?: string[];
  tags?: string[];
  symbols?: string[];
  thumbnail?: string | null;
}

export interface NewsResult {
  articles: NewsArticleFull[];
}

export interface IndexPoint {
  date: string;
  price: number;
}

export interface IdxTotalPoint {
  date: string;
  marketCap: number;
}

export interface MoverRow {
  symbol: string;
  companyName: string;
  priceChange: number;
  lastClosePrice: number;
  latestCloseDate: string;
}

export interface MostTradedRow {
  symbol: string;
  companyName: string;
  volume: number;
  price: number;
  /** Close-over-close vs the previous trading day; null when that day is not in the API window. */
  priceChange: number | null;
}

export interface TickerTapeRow {
  symbol: string;
  price: number | null;
  change: number | null;
}

export interface MarketOverview {
  ihsg: IndexPoint[];
  idxTotal: IdxTotalPoint[];
  movers: { gainers: MoverRow[]; losers: MoverRow[] };
  mostTraded: MostTradedRow[];
  indexChips: Record<string, IndexPoint[]>;
  tickerTape: TickerTapeRow[];
}

export interface SimilarityMatch {
  symbol: string;
  companyName: string;
  matchStartDate: string;
  matchEndDate: string;
  similarity: number;
  outcomeWindowDays: number;
  outcomeChangePercent: number | null;
}

export interface PatternSimilarityResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  windowDays: number;
  outcomeWindowDays: number;
  warning: string;
  matches: SimilarityMatch[];
}

export interface IndicatorPoint {
  date: string;
  value: number;
}

export interface MovingAverageSeries {
  period: number;
  label: string;
  points: IndicatorPoint[];
}

export interface RsiSeries {
  period: number;
  points: IndicatorPoint[];
}

export interface IndicatorResult {
  symbol: string;
  status: 'ok' | 'inadequate';
  movingAverages: MovingAverageSeries[];
  rsi: RsiSeries | null;
  explanation: { movingAverage: string; rsi: string };
}

export interface AnomalyMetric {
  key: 'volume' | 'priceChange';
  label: string;
  latestValue: number;
  baselineMean: number;
  baselineStdDev: number;
  baselineDays: number;
  zScore: number;
  isAnomaly: boolean;
}

export interface NewsArticle {
  title: string;
  source: string;
  timestamp: string;
  thumbnail?: string | null;
}

export interface AnomalyResult {
  symbol: string;
  date: string | null;
  status: 'ok' | 'inadequate';
  threshold: number;
  metrics: AnomalyMetric[];
  hasAnomaly: boolean;
  relatedNews: NewsArticle[];
  newsDisclaimer: string | null;
}

export interface FrameworkCriterion {
  key: string;
  label: string;
  met: boolean | null;
  detail: string;
}

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
  scoredCount: number;
  healthyCount: number;
  criticalCount: number;
  topCompany: SectorSpotlightCompanyRef | null;
  laggardCompany: SectorSpotlightCompanyRef | null;
}

export type ValuationRelativeToPeers = 'below-average' | 'in-line' | 'above-average' | 'unknown';

export interface ValuationSpotlightRow {
  symbol: string;
  companyName: string;
  year: number | null;
  pe: number | null;
  pePeerAvg: number | null;
  relativeToPeers: ValuationRelativeToPeers;
}

export interface MarketSorotan {
  sektor: SectorSpotlightCard[];
  valuasi: ValuationSpotlightRow[];
}

export interface ValuationYear {
  year: number;
  pe: number | null;
  pePeerAvg: number | null;
  pb: number | null;
  pbPeerAvg: number | null;
  ps: number | null;
  psPeerAvg: number | null;
  pcf: number | null;
  peg: number | null;
}

export interface FinancialYear {
  year: number;
  revenue: number | null;
  earnings: number | null;
  ebitda: number | null;
}

export interface FundamentalExtras {
  symbol: string;
  year: number | null;
  pe: number | null;
  pePeerAvg: number | null;
  pb: number | null;
  dividendYieldTtm: number | null;
  casaRatio: number | null;
  costToIncomeRatio: number | null;
  historicalValuation: ValuationYear[];
  historicalFinancials: FinancialYear[];
  lastClosePrice: number | null;
  latestCloseDate: string | null;
  dailyCloseChange: number | null;
}

export interface FrameworkResult {
  symbol: string;
  frameworkName: string;
  frameworkDescription: string;
  year: string | null;
  priorYear: string | null;
  criteria: FrameworkCriterion[];
  pointsMet: number;
  pointsApplicable: number;
  classification: string;
  status: 'ok' | 'inadequate';
}

/** F-06 run across the day's busiest names — see backend/src/analysis/marketAnomalyScan.ts */
export interface MarketAnomalyRow {
  symbol: string;
  companyName: string;
  status: 'ok' | 'inadequate';
  date: string | null;
  hasAnomaly: boolean;
  triggered: AnomalyMetric[];
}

export interface MarketAnomalyScan {
  scannedAt: string;
  threshold: number;
  rows: MarketAnomalyRow[];
}
