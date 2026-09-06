// Domain types normalized from raw Sectors API responses.
// Every normalized result carries `fetchedAt` (ISO timestamp) per ADD-SH2026-003
// section 4: "Setiap besaran turunan wajib menyimpan penanda waktu pengambilan data."

export interface WithFetchedAt {
  fetchedAt: string;
}

// --- E-06 / E-07: Helper lists -------------------------------------------------

export interface SubsectorEntry {
  sector: string;
  subsector: string;
}

export interface IndustryEntry {
  subsector: string;
  industry: string;
}

// --- E-01: Companies Screener ---------------------------------------------------

export interface CompanyScreenerItem {
  symbol: string;
  companyName: string;
  /** Present only when the query requested include_query_values=true. */
  queryValues?: Record<string, unknown> | null;
}

export interface CompanyScreenerResult extends WithFetchedAt {
  items: CompanyScreenerItem[];
  totalCount: number;
  hasNext: boolean;
  nextOffset: number | null;
}

// --- E-02: Company Report --------------------------------------------------------

export type CompanyReportSection =
  | 'overview'
  | 'valuation'
  | 'future'
  | 'peers'
  | 'financials'
  | 'dividend'
  | 'management'
  | 'ownership';

export interface FinancialRatioYear {
  year: string;
  profitability?: {
    roa?: number | null;
    roe?: number | null;
    net_profit_margin?: number | null;
    operating_profit_margin?: number | null;
    net_interest_margin?: number | null;
    cost_to_income_ratio?: number | null;
    efficiency_ratio?: number | null;
  };
  leverage?: {
    debt_to_asset_ratio?: number | null;
    debt_to_equity_ratio?: number | null;
  };
  liquidity?: {
    loan_to_deposit_ratio?: number | null;
    operating_cash_flow_margin?: number | null;
    [key: string]: number | null | undefined;
  };
  efficiency?: {
    total_asset_turnover?: number | null;
    [key: string]: number | null | undefined;
  };
  capital?: {
    capital_adequacy_ratio?: number | null;
    [key: string]: number | null | undefined;
  };
}

export interface CompanyReportOverview {
  sector?: string;
  sub_sector?: string;
  industry?: string;
  sub_industry?: string;
  market_cap?: number;
  market_cap_rank?: number;
  last_close_price?: number;
  latest_close_date?: string;
  listing_date?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface CompanyReportFinancials {
  eps?: number;
  historical_financial_ratio?: FinancialRatioYear[];
  historical_financials?: Record<string, unknown>[];
  yoy_quarter_earnings_growth?: number | null;
  yoy_quarter_revenue_growth?: number | null;
  [key: string]: unknown;
}

/** Raw shape returned by the API — only requested sections are present. */
export interface RawCompanyReport {
  symbol: string;
  company_name: string;
  overview?: CompanyReportOverview;
  valuation?: Record<string, unknown>;
  future?: Record<string, unknown>;
  financials?: CompanyReportFinancials;
  dividend?: Record<string, unknown>;
  management?: Record<string, unknown>;
  ownership?: Record<string, unknown>;
  peers?: unknown[];
}

export interface CompanyReport extends WithFetchedAt {
  symbol: string;
  companyName: string;
  sections: CompanyReportSection[];
  overview?: CompanyReportOverview;
  valuation?: Record<string, unknown>;
  future?: Record<string, unknown>;
  financials?: CompanyReportFinancials;
  dividend?: Record<string, unknown>;
  management?: Record<string, unknown>;
  ownership?: Record<string, unknown>;
  peers?: unknown[];
}

// --- E-03: Daily Transaction Data -------------------------------------------------

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

export interface DailySeries extends WithFetchedAt {
  symbol: string;
  bars: DailyBar[];
}

// --- E-05: Quarterly Financials ---------------------------------------------------

export interface QuarterlyFinancial {
  symbol: string;
  date: string;
  revenue: number | null;
  earnings: number | null;
  totalAssets: number | null;
  totalEquity: number | null;
  operatingCashFlow: number | null;
  raw: Record<string, unknown>;
}

export interface QuarterlyFinancialsResult extends WithFetchedAt {
  symbol: string;
  quarters: QuarterlyFinancial[];
}

// --- E-04: News ---------------------------------------------------------------------

/** Sectors' own topic scoring for an article, one count per axis. */
export type NewsDimension = Record<string, number>;

export interface NewsArticle {
  /** Penanda stabil untuk route /berita/:id — turunan dari URL sumber. */
  id?: string;
  title: string;
  body?: string;
  source: string;
  timestamp: string;
  sector?: string;
  subSector?: string[];
  tags?: string[];
  symbols?: string[];
  thumbnail?: string | null;
  dimension?: NewsDimension;
}

export interface NewsResult extends WithFetchedAt {
  articles: NewsArticle[];
  /** Total articles Sectors reports for the query, not just this page. */
  totalCount: number;
}
