import { sectorsGet } from './sectorsClient.js';
import type { CompanyScreenerResult, CompanyScreenerItem } from './types.js';

interface RawCompanyScreenerItem {
  symbol: string;
  company_name: string;
  query_values?: Record<string, unknown> | null;
}

interface RawCompanyScreenerResponse {
  results: RawCompanyScreenerItem[];
  pagination: {
    total_count: number;
    has_next: boolean;
    next_offset: number | null;
  };
}

export interface SearchCompaniesParams {
  /** SQL-like filter, e.g. `sub_sector = 'banks' and market_cap > 1000000000`. */
  where?: string;
  /** Field to sort by, `-` prefix for descending, e.g. `-market_cap`. */
  orderBy?: string;
  limit?: number;
  offset?: number;
  /** Include the values of fields referenced in where/orderBy per result. */
  includeQueryValues?: boolean;
}

/**
 * E-01: Companies Screener (structured query mode — 1 credit/call).
 * Deliberately does not expose the natural-language `q` mode: it costs 3x more
 * and its output isn't reliable enough to build deterministic screener logic on.
 */
export async function searchCompanies(params: SearchCompaniesParams = {}): Promise<CompanyScreenerResult> {
  const raw = await sectorsGet<RawCompanyScreenerResponse>('/v2/companies/', {
    params: {
      where: params.where,
      order_by: params.orderBy,
      limit: params.limit,
      offset: params.offset,
      include_query_values: params.includeQueryValues ? 'true' : undefined,
    },
  });

  const items: CompanyScreenerItem[] = raw.results.map((r) => ({
    symbol: r.symbol,
    companyName: r.company_name,
    queryValues: r.query_values ?? null,
  }));

  return {
    items,
    totalCount: raw.pagination.total_count,
    hasNext: raw.pagination.has_next,
    nextOffset: raw.pagination.next_offset,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Full IDX company list, paginated to the API's 200-per-page max (~5 calls
 * for ~960 companies). Powers instant client-side search (TradingView-style
 * autocomplete) without spending a credit per keystroke — fetch once,
 * cached 24h per page, filter locally on the frontend.
 */
export async function getAllCompanies(): Promise<CompanyScreenerItem[]> {
  const pageSize = 200;
  const first = await searchCompanies({ limit: pageSize, offset: 0 });
  const pages = [first.items];
  const totalPages = Math.ceil(first.totalCount / pageSize);

  for (let page = 1; page < totalPages; page++) {
    const next = await searchCompanies({ limit: pageSize, offset: page * pageSize });
    pages.push(next.items);
  }

  return pages.flat();
}
