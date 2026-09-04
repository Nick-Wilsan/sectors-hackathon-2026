import { sectorsGet } from './sectorsClient.js';
import type { QuarterlyFinancial, QuarterlyFinancialsResult } from './types.js';

export interface GetQuarterlyFinancialsParams {
  reportDate?: string;
  approx?: boolean;
  /** Number of most recent quarters to return — use this to bound credit cost. */
  nQuarters?: number;
}

/**
 * E-05: Quarterly Financials (1 credit per quarter returned — always pass
 * `nQuarters` unless you deliberately want the full history).
 */
export async function getQuarterlyFinancials(
  symbol: string,
  params: GetQuarterlyFinancialsParams = {},
): Promise<QuarterlyFinancialsResult> {
  const raw = await sectorsGet<Record<string, unknown>[]>(`/v2/financials/quarterly/${encodeURIComponent(symbol)}/`, {
    params: {
      report_date: params.reportDate,
      approx: params.approx === undefined ? undefined : String(params.approx),
      n_quarters: params.nQuarters,
    },
  });

  const quarters: QuarterlyFinancial[] = raw.map((item) => ({
    symbol: String(item.symbol),
    date: String(item.date),
    revenue: (item.revenue as number | null) ?? null,
    earnings: (item.earnings as number | null) ?? null,
    totalAssets: (item.total_assets as number | null) ?? null,
    totalEquity: (item.total_equity as number | null) ?? null,
    operatingCashFlow: (item.operating_cash_flow as number | null) ?? null,
    raw: item,
  }));

  return { symbol, quarters, fetchedAt: new Date().toISOString() };
}
