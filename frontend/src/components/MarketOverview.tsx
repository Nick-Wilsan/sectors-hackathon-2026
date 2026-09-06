import { useEffect, useMemo, useState } from 'react';
import { getMarketAnomalyScan, getMarketNews, getMarketOverview, getMarketSorotan } from '../api/client';
import type { MarketAnomalyScan, MarketOverview as MarketOverviewData, MarketSorotan, NewsArticleFull } from '../api/types';
import { IhsgAreaChart } from './IhsgAreaChart';
import { NewsSpotlightCard } from './NewsSpotlightCard';
import { IndexChipRow } from './IndexChipRow';
import { VolumeLeadersTable } from './VolumeLeadersTable';
import { MoversToggleCard } from './MoversToggleCard';
import { SectorSpotlightGrid } from './SectorSpotlightGrid';
import { ValuationSpotlight } from './ValuationSpotlight';
import { FeaturedStockPanel } from './FeaturedStockPanel';
import { MarketAnomalyStrip } from './MarketAnomalyStrip';

function formatIdr(value: number): string {
  const num = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1e12) return `Rp ${num(value / 1e12)} T`;
  if (value >= 1e9) return `Rp ${num(value / 1e9)} M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

/** Indonesian numeral convention: "." as thousands separator, "," as decimal — matches the reference mockup's "7.322,40" formatting. */
function formatIndexPoints(value: number): string {
  return value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Plain colored text (no pill) — matches the mockup's Performa 7/30 Hari
// mini-box treatment. The main price-change readout uses MainChangeBadge
// below instead, which has the mockup's pill + trend-icon treatment.
function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`font-label-mono-md text-label-mono-md font-bold tabular-nums ${positive ? 'text-state-positive' : 'text-state-negative'}`}>
      {positive ? '+' : ''}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

function MainChangeBadge({ absolute, ratio }: { absolute: number; ratio: number }) {
  const positive = ratio >= 0;
  return (
    <span
      className={`inline-flex items-center gap-space-4 rounded px-space-6 py-space-2 font-label-mono-md text-label-mono-md font-bold tabular-nums ${
        positive ? 'bg-state-positive/10 text-state-positive' : 'bg-state-negative/10 text-state-negative'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{positive ? 'trending_up' : 'trending_down'}</span>
      {positive ? '+' : ''}
      {formatIndexPoints(absolute)} ({positive ? '+' : ''}
      {(ratio * 100).toFixed(2)}%)
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

const RANGE_OPTIONS = [
  { days: 30, label: '1 Bln' },
  { days: 90, label: '3 Bln' },
] as const;

interface MarketOverviewProps {
  /** Rendered directly beneath the IHSG hero — the page's primary analysis panel. */
  insightSlot?: React.ReactNode;
}

export function MarketOverview({ insightSlot }: MarketOverviewProps) {
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [news, setNews] = useState<NewsArticleFull[]>([]);
  const [sorotan, setSorotan] = useState<MarketSorotan | null>(null);
  const [rangeDays, setRangeDays] = useState<30 | 90>(90);
  const [anomalyScan, setAnomalyScan] = useState<MarketAnomalyScan | null>(null);

  useEffect(() => {
    getMarketOverview()
      .then(setData)
      .catch(() => {});
    getMarketNews(9)
      .then((r) => setNews(r.articles))
      .catch(() => {});
    // Real auto-refresh (not just a claimed cadence) — news is cached 6h
    // server-side, so this costs nothing extra most of the time and just
    // picks up whatever's newest once the cache does roll over.
    const newsInterval = setInterval(() => {
      getMarketNews(9)
        .then((r) => setNews(r.articles))
        .catch(() => {});
    }, 10 * 60 * 1000);
    // Fetched separately — this aggregates several sub-sectors' worth of
    // company reports and is slower than the rest of the dashboard, so it
    // shouldn't block the fast, always-needed overview data above.
    getMarketSorotan()
      .then(setSorotan)
      .catch(() => {});
    // Costs one daily-series credit per scanned symbol (24h cached), so it is
    // its own request rather than part of /overview.
    getMarketAnomalyScan()
      .then(setAnomalyScan)
      .catch(() => {});

    return () => clearInterval(newsInterval);
  }, []);

  // Sectors' index-daily endpoint clamps any request to ~90 calendar days of
  // history no matter what start date is passed — so "1 Bln"/"3 Bln" toggles
  // both slice the one 90-day fetch client-side rather than refetching;
  // there's no real 6M/1Y/ALL data to offer honestly.
  const ihsgWindow = useMemo(() => (data ? data.ihsg.slice(-rangeDays) : []), [data, rangeDays]);
  const ihsgPrices = ihsgWindow.map((p) => p.price);
  const ihsgLast = ihsgPrices[ihsgPrices.length - 1];
  const ihsgPrev = ihsgPrices[ihsgPrices.length - 2];
  const absoluteChange1d = ihsgPrev !== undefined ? ihsgLast - ihsgPrev : null;
  const change1d = changeOverWindow(ihsgPrices, 1);
  const change7d = changeOverWindow(ihsgPrices, 7);
  const change30d = changeOverWindow(ihsgPrices, 30);
  const periodHigh = ihsgPrices.length > 0 ? Math.max(...ihsgPrices) : null;
  const periodLow = ihsgPrices.length > 0 ? Math.min(...ihsgPrices) : null;
  // Negative (or zero at a new high) by construction — how far below the
  // window's peak the index currently sits.
  const fromHigh = periodHigh && ihsgLast !== undefined ? (ihsgLast - periodHigh) / periodHigh : null;
  const latestMcap = data?.idxTotal[data.idxTotal.length - 1]?.marketCap;

  const rangeLabel = RANGE_OPTIONS.find((o) => o.days === rangeDays)?.label;

  return (
    <div className="border-b border-border-subtle bg-background-base">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-space-24 px-space-16 py-space-16">
        {/* IHSG hero (left) paired with a news preview (right) — ported from the
            reference mockup's "Section 1" top row. Search lives only in the header,
            same as the mockup (no duplicate hero search box). */}
        <div className="grid grid-cols-1 gap-space-8 xl:grid-cols-12">
          <div className="flex flex-col rounded border border-border-subtle bg-surface-card p-space-16 xl:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-space-8 border-b border-border-subtle pb-space-12">
              <div className="flex items-center gap-space-8">
                <div className="flex h-9 w-9 items-center justify-center rounded border border-border-subtle bg-surface-container">
                  <span className="material-symbols-outlined text-[20px] text-primary-container">stacked_line_chart</span>
                </div>
                <div>
                  <div className="flex items-center gap-space-6">
                    <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-text-primary">IHSG COMPOSITE</span>
                    <span className="rounded bg-surface-container px-space-4 py-space-2 font-label-mono-sm text-label-mono-sm text-text-secondary">
                      IDX:COMPOSITE
                    </span>
                    <span
                      className="inline-flex items-center gap-space-2 rounded-full bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold text-text-muted"
                      title="Harga penutupan harian, bukan feed real-time"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                      Data EOD
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-muted">Indeks Harga Saham Gabungan &middot; Bursa Efek Indonesia</p>
                </div>
              </div>
              <div className="inline-flex rounded border border-border-subtle bg-background-base p-space-2 font-label-mono-sm text-label-mono-sm">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setRangeDays(opt.days)}
                    className={`rounded px-space-8 py-space-2 transition-colors ${
                      rangeDays === opt.days ? 'bg-surface-container font-bold text-primary-container' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-space-12 flex flex-wrap items-baseline justify-between gap-space-8">
              <div className="flex items-baseline gap-space-12">
                <span className="font-display-lg text-display-lg tracking-tight text-text-primary">
                  {ihsgLast !== undefined ? formatIndexPoints(ihsgLast) : '—'}
                </span>
                {change1d !== null && absoluteChange1d !== null && <MainChangeBadge absolute={absoluteChange1d} ratio={change1d} />}
              </div>
              <div className="flex flex-wrap gap-space-16 font-label-mono-sm text-label-mono-sm text-text-muted">
                {periodHigh !== null && (
                  <span>
                    Tertinggi ({rangeLabel}): <strong className="text-text-primary">{formatIndexPoints(periodHigh)}</strong>
                  </span>
                )}
                {periodLow !== null && (
                  <span>
                    Terendah: <strong className="text-text-primary">{formatIndexPoints(periodLow)}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-space-8">
              <IhsgAreaChart points={ihsgWindow} positive={(change1d ?? 0) >= 0} height={140} />
            </div>

            <div className="my-auto grid grid-cols-2 gap-space-8 pt-space-12 sm:grid-cols-4">
              <div className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
                <span className="block font-body-sm text-body-sm text-text-muted">Performa 7 Hari</span>
                {change7d !== null ? <ChangeTag value={change7d} /> : <span className="text-text-muted">—</span>}
              </div>
              <div className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
                <span className="block font-body-sm text-body-sm text-text-muted">Performa 30 Hari</span>
                {change30d !== null ? <ChangeTag value={change30d} /> : <span className="text-text-muted">—</span>}
              </div>
              {/* The mockup's fourth pill is YTD, which this data can't honestly
                  fill (Sectors clamps index history to ~90 days). Rather than
                  leave a greyed-out "Segera" cell in the hero, this shows the
                  index's distance from its high in the window on screen —
                  purely descriptive, and derived from the same series. */}
              <div className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
                <span className="block font-body-sm text-body-sm text-text-muted">Dari Tertinggi ({rangeLabel})</span>
                {fromHigh !== null ? (
                  <ChangeTag value={fromHigh} />
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
              <div className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
                <span className="block font-body-sm text-body-sm text-text-muted">Market Cap Bursa</span>
                {latestMcap !== undefined ? (
                  <span className="font-label-mono-md text-label-mono-md font-bold text-text-primary">{formatIdr(latestMcap)}</span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
            </div>

            {data && (
              <div className="mt-space-12 border-t border-border-subtle pt-space-12">
                <IndexChipRow indexChips={data.indexChips} />
              </div>
            )}
          </div>

          <div className="xl:col-span-5">
            <NewsSpotlightCard articles={news} />
          </div>
        </div>

        {insightSlot}

        {anomalyScan && anomalyScan.rows.length > 0 && <MarketAnomalyStrip scan={anomalyScan} />}

        {sorotan && (
          <div>
            <div className="flex flex-col gap-space-4 border-b border-border-subtle pb-space-8 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-space-4 flex items-center gap-space-8">
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary-container" />
                  <span className="font-label-mono-sm text-label-mono-sm font-semibold uppercase tracking-wider text-primary">
                    Sectors Intelligence
                  </span>
                </div>
                <h2 id="sektor-idx" className="scroll-mt-24 font-headline-lg text-headline-lg tracking-tight text-text-primary">Ikhtisar Sub-Sektor IDX</h2>
                <p className="mt-space-2 font-body-sm text-body-sm text-text-secondary">
                  Sebaran Skor Komposit Fundamental pada 6 sub-sektor terpilih.
                </p>
              </div>
            </div>
            <div className="mt-space-8">
              <SectorSpotlightGrid cards={sorotan.sektor} />
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 gap-space-8 lg:grid-cols-12">
            <VolumeLeadersTable mostTraded={data.mostTraded} />
            <MoversToggleCard gainers={data.movers.gainers} losers={data.movers.losers} />
            {sorotan && <ValuationSpotlight rows={sorotan.valuasi} />}
          </div>
        )}

        <FeaturedStockPanel tickerTape={data?.tickerTape} />
      </div>
    </div>
  );
}
