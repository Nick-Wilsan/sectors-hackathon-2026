import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarketNews, getMarketOverview } from '../api/client';
import type { MarketOverview as MarketOverviewData, MoverRow, NewsArticleFull } from '../api/types';
import { Sparkline } from './Sparkline';
import { NewsFeed } from './NewsFeed';
import { SymbolSearch } from './SymbolSearch';

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

function MoverList({ title, rows }: { title: string; rows: MoverRow[] }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</div>
      <div className="mt-1.5 divide-y divide-neutral-800/70">
        {rows.map((r) => (
          <Link
            key={r.symbol}
            to={`/emiten/${r.symbol.replace('.JK', '')}`}
            className="flex items-center justify-between py-1.5 text-xs hover:bg-neutral-800/50"
          >
            <span className="font-mono text-neutral-300">{r.symbol.replace('.JK', '')}</span>
            <span className="font-mono tabular-nums text-neutral-500">{r.lastClosePrice.toLocaleString('id-ID')}</span>
            <ChangeTag value={r.priceChange} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MarketOverview() {
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [news, setNews] = useState<NewsArticleFull[]>([]);

  useEffect(() => {
    getMarketOverview()
      .then(setData)
      .catch(() => {});
    getMarketNews(6)
      .then((r) => setNews(r.articles))
      .catch(() => {});
  }, []);

  const ihsgPrices = data?.ihsg.map((p) => p.price) ?? [];
  const ihsgLast = ihsgPrices[ihsgPrices.length - 1];
  const ihsgPrev = ihsgPrices[ihsgPrices.length - 2];
  const ihsgChange = ihsgPrev ? (ihsgLast - ihsgPrev) / ihsgPrev : 0;
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
        {/* Left: IHSG hero + movers, spans 2 of 3 columns on large screens */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">IHSG (1D)</span>
              {data && <ChangeTag value={ihsgChange} />}
            </div>
            <div className="mt-1 flex items-end justify-between gap-4">
              <span className="font-mono text-3xl tabular-nums text-neutral-100">{ihsgLast?.toFixed(2) ?? '—'}</span>
              {ihsgPrices.length > 1 && <Sparkline values={ihsgPrices} width={200} height={56} color={ihsgChange >= 0 ? '#10b981' : '#f43f5e'} />}
            </div>
            {latestMcap !== undefined && (
              <div className="mt-2 text-xs text-neutral-500">
                Kapitalisasi pasar total: <span className="font-mono tabular-nums text-neutral-400">Rp{formatIdr(latestMcap)}</span>
              </div>
            )}
          </div>

          {data && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <MoverList title="Top Gainers (1D)" rows={data.movers.gainers} />
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <MoverList title="Top Losers (1D)" rows={data.movers.losers} />
              </div>
            </div>
          )}
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
