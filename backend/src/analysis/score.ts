import type { CompanyReportFinancials, FinancialRatioYear } from '../data/types.js';
import { percentileRank, invertPercentile, MIN_MEANINGFUL_GROUP_SIZE } from './percentile.js';

// F-01 Mesin Skor Fundamental Komposit — formula dikunci di Technical Spec
// bagian 11 (keputusan 4 September 2026) dan ADD-SH2026-003 D-01/D-02.

export const SCORE_COMPONENTS = [
  { key: 'roe', label: 'Profitabilitas Modal (ROE)', weight: 0.25, direction: 'higher' as const },
  { key: 'netProfitMargin', label: 'Margin Laba Bersih', weight: 0.2, direction: 'higher' as const },
  { key: 'der', label: 'Kesehatan Utang (DER)', weight: 0.2, direction: 'lower' as const },
  { key: 'ocfMargin', label: 'Margin Arus Kas Operasional', weight: 0.2, direction: 'higher' as const },
  { key: 'roa', label: 'Profitabilitas Aset (ROA)', weight: 0.15, direction: 'higher' as const },
] as const;

export type ComponentKey = (typeof SCORE_COMPONENTS)[number]['key'];

export type ComponentRatios = Record<ComponentKey, number | null> & { year: string | null };

export interface ComponentScoreDetail {
  key: ComponentKey;
  label: string;
  rawValue: number;
  /** 0-100, already inverted for "lower is better" metrics. Higher = better, always. */
  percentile: number;
  /** Weight actually used for this company's score, after renormalizing for missing components. */
  weightUsed: number;
  groupSize: number;
  groupSizeAdequate: boolean;
}

export interface CompositeScoreResult {
  symbol: string;
  status: 'ok' | 'partial' | 'inadequate';
  /** null when status is 'inadequate'. */
  score: number | null;
  year: string | null;
  components: ComponentScoreDetail[];
  missingComponents: ComponentKey[];
}

/** Picks the most recent year's ratio entry from a company report's financials section. */
export function latestRatioYear(financials?: CompanyReportFinancials): FinancialRatioYear | undefined {
  const arr = financials?.historical_financial_ratio;
  if (!arr || arr.length === 0) return undefined;
  return [...arr].sort((a, b) => Number(b.year) - Number(a.year))[0];
}

/** Extracts the 5 raw ratios this score needs from a company's latest reported year. */
export function extractRatios(financials?: CompanyReportFinancials): ComponentRatios | null {
  const latest = latestRatioYear(financials);
  if (!latest) return null;

  return {
    year: latest.year ?? null,
    roe: latest.profitability?.roe ?? null,
    roa: latest.profitability?.roa ?? null,
    netProfitMargin: latest.profitability?.net_profit_margin ?? null,
    der: latest.leverage?.debt_to_equity_ratio ?? null,
    ocfMargin: latest.liquidity?.operating_cash_flow_margin ?? null,
  };
}

/**
 * Computes the composite score for one company against a comparison group
 * (typically every company in its sub-sector, target included).
 *
 * Pure function — no I/O. Callers fetch `target`/`group` via the data layer
 * (see src/data/companyReport.ts) so this stays independently testable.
 */
export function computeCompositeScore(
  symbol: string,
  target: ComponentRatios | null,
  group: ComponentRatios[],
): CompositeScoreResult {
  if (!target) {
    return { symbol, status: 'inadequate', score: null, year: null, components: [], missingComponents: [...SCORE_COMPONENTS.map((c) => c.key)] };
  }

  const missingComponents = SCORE_COMPONENTS.filter((c) => target[c.key] === null).map((c) => c.key);

  if (missingComponents.length > 1) {
    return { symbol, status: 'inadequate', score: null, year: target.year, components: [], missingComponents };
  }

  const presentComponents = SCORE_COMPONENTS.filter((c) => target[c.key] !== null);
  const presentWeightSum = presentComponents.reduce((sum, c) => sum + c.weight, 0);

  const components: ComponentScoreDetail[] = presentComponents.map((c) => {
    const rawValue = target[c.key] as number;
    const groupValues = group.map((g) => g[c.key]);
    const { percentile: rawPercentile, groupSize } = percentileRank(rawValue, groupValues);
    const percentile = c.direction === 'lower' ? invertPercentile(rawPercentile) : rawPercentile;

    return {
      key: c.key,
      label: c.label,
      rawValue,
      percentile,
      weightUsed: c.weight / presentWeightSum,
      groupSize,
      groupSizeAdequate: groupSize >= MIN_MEANINGFUL_GROUP_SIZE,
    };
  });

  const score = components.reduce((sum, c) => sum + c.percentile * c.weightUsed, 0);

  return {
    symbol,
    status: missingComponents.length === 0 ? 'ok' : 'partial',
    score: Math.round(score * 100) / 100,
    year: target.year,
    components,
    missingComponents,
  };
}
