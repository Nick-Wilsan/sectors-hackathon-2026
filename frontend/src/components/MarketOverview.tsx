import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarketNews, getMarketOverview } from '../api/client';
import type { MarketOverview as MarketOverviewData, NewsArticleFull } from '../api/types';
import { Sparkline } from './Sparkline';
import { NewsFeed } from './NewsFeed';
import { SymbolSearch } from './SymbolSearch';
import { IndexChipRow } from './IndexChipRow';
import { MoversWidget } from './MoversWidget';

function formatIdr(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}M`;
  return value.toLocaleString('id-ID');
}

function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`font-mono text-xs tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
      {positive ? '+' : ''}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

/** % change between the latest point and the point `tradingDaysBack` earlier — all derived client-side from data already fetched, no new API calls. */
function changeOverWindow(prices: number[], tradingDaysBack: number): number | null {
  if (prices.length < 2) return null;
  const lastIdx = prices.length - 1;
  const startIdx = Math.max(0, lastIdx - tradingDaysBack);
  if (startIdx === lastIdx) return null;
  const start = prices[startIdx];
  return start ? (prices[lastIdx] - start) / start : null;
}

export function MarketOverview() {
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [news, setNews] = useState<NewsArticleFull[]>([]);

  useEffect(() => {
    getMarketOverview()
      .then(setData)
      .catch(() => {});
    getMarketNews(8)
      .then((r) => setNews(r.articles))
      .catch(() => {});
  }, []);

  const ihsgPrices = data?.ihsg.map((p) => p.price) ?? [];
  const ihsgLast = ihsgPrices[ihsgPrices.length - 1];
  const change1d = changeOverWindow(ihsgPrices, 1);
  const change7d = changeOverWindow(ihsgPrices, 7);
  const change30d = changeOverWindow(ihsgPrices, 30);
  const latestMcap = data?.idxTotal[data.idxTotal.length - 1]?.marketCap;

  return (
    <div className="border-b border-neutral-800 bg-neutral-950">
      {/* Hero search — the primary entry point, matching a search-first market homepage. */}
      <div className="flex justify-center border-b border-neutral-900 px-4 py-6 sm:px-6">
        <div className="w-full max-w-xl text-center">
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">Cari emiten IDX</p>
          <SymbolSearch size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-3 sm:px-6">
        {/* Left: IHSG hero + index chips + movers, spans 2 of 3 columns on large screens */}
        <div className="space-y-3 lg:col-span-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">IHSG</span>
              {change1d !== null && <ChangeTag value={change1d} />}
            </div>
            <div className="mt-1 flex items-end justify-between gap-4">
              <span className="font-mono text-3xl tabular-nums text-neutral-100">{ihsgLast?.toFixed(2) ?? '—'}</span>
              {ihsgPrices.length > 1 && <Sparkline values={ihsgPrices} width={200} height={56} color={(change1d ?? 0) >= 0 ? '#10b981' : '#f43f5e'} />}
            </div>

            <div className="mt-3 flex gap-6 border-t border-neutral-800 pt-3 text-xs">
              <div>
                <div className="text-neutral-500">1 Hari</div>
                {change1d !== null ? <ChangeTag value={change1d} /> : <span className="text-neutral-600">—</span>}
              </div>
              <div>
                <div className="text-neutral-500">7 Hari</div>
                {change7d !== null ? <ChangeTag value={change7d} /> : <span className="text-neutral-600">—</span>}
              </div>
              <div>
                <div className="text-neutral-500">30 Hari</div>
                {change30d !== null ? <ChangeTag value={change30d} /> : <span className="text-neutral-600">—</span>}
              </div>
              {latestMcap !== undefined && (
                <div className="ml-auto text-right">
                  <div className="text-neutral-500">Kap. Pasar Total</div>
                  <div className="font-mono tabular-nums text-neutral-300">Rp{formatIdr(latestMcap)}</div>
                </div>
              )}
            </div>
          </div>

          {data && <IndexChipRow indexChips={data.indexChips} />}

          {data && <MoversWidget gainers={data.movers.gainers} losers={data.movers.losers} mostTraded={data.mostTraded} />}
        </div>

        {/* Right: news feed */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Berita Pasar</span>
            <Link to="/berita" className="text-[11px] text-brand hover:text-brand-light">
              Lihat semua
            </Link>
          </div>
          <div className="mt-1">
            <NewsFeed articles={news} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
