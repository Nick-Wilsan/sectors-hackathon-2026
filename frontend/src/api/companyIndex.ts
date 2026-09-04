import { getAllCompanies } from './client';
import type { CompanyLite } from './types';

// Fetched once per browser session (the backend caches the underlying ~5
// Sectors calls for 24h too) and searched entirely client-side afterward —
// no credit spent per keystroke, unlike calling the screener on every input change.
let cache: Promise<CompanyLite[]> | null = null;

export function loadCompanyIndex(): Promise<CompanyLite[]> {
  if (!cache) cache = getAllCompanies();
  return cache;
}

export function searchCompanyIndex(companies: CompanyLite[], query: string, limit = 8): CompanyLite[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const bySymbolPrefix: CompanyLite[] = [];
  const bySymbolContains: CompanyLite[] = [];
  const byName: CompanyLite[] = [];

  for (const c of companies) {
    const symbol = c.symbol.replace('.JK', '');
    if (symbol.startsWith(q)) bySymbolPrefix.push(c);
    else if (symbol.includes(q)) bySymbolContains.push(c);
    else if (c.companyName.toUpperCase().includes(q)) byName.push(c);
  }

  return [...bySymbolPrefix, ...bySymbolContains, ...byName].slice(0, limit);
}
