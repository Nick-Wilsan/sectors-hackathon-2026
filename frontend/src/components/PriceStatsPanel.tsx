import { useMemo } from 'react';
import type { DailyBar } from '../api/types';

/**
 * Descriptive statistics for whatever window the chart is currently showing.
 * Everything here is computed client-side from bars already fetched, so the
 * panel follows the 5H/1B/3B selector and costs no extra API credit.
 *
 * Strictly descriptive: it reports what the price has done, never what it is
 * expected to do. Volatility is presented as measured dispersion, not as risk
 * advice or a forecast (PRD B-02/B-04).
 */
export function PriceStatsPanel({ bars, rangeLabel }: { bars: DailyBar[]; rangeLabel: string }) {
  const stats = useMemo(() => {
    const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) return null;

    const closes = sorted.map((b) => b.close);
    const last = closes[closes.length - 1];
    const high = Math.max(...closes);
    const low = Math.min(...closes);
    const highBar = sorted.find((b) => b.close === high)!;
    const lowBar = sorted.find((b) => b.close === low)!;

    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      if (closes[i - 1]) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const up = returns.filter((r) => r > 0).length;
    const down = returns.filter((r) => r < 0).length;
    const flat = returns.length - up - down;

    const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length || 1);
    const stdDev = Math.sqrt(variance);

    const avgVolume = sorted.reduce((a, b) => a + b.volume, 0) / sorted.length;
    const positionPct = high === low ? 50 : ((last - low) / (high - low)) * 100;
    const fromHigh = high ? (last - high) / high : 0;

    return { last, high, low, highBar, lowBar, up, down, flat, stdDev, avgVolume, positionPct, fromHigh, days: sorted.length };
  }, [bars]);

  if (!stats) {
    return null;
  }

  const total = stats.up + stats.down + stats.flat || 1;
  const num = (v: number) => v.toLocaleString('id-ID');

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex flex-wrap items-center justify-between gap-space-8 border-b border-border-subtle pb-space-8">
        <div className="flex items-center gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">query_stats</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Statistik Harga &mdash; {rangeLabel}</h2>
        </div>
        <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{stats.days} hari bursa</span>
      </div>

      {/* Where the last close sits inside the period's range. */}
      <div className="mt-space-12">
        <div className="flex items-baseline justify-between font-label-mono-sm text-label-mono-sm">
          <span className="text-state-negative">Terendah {num(stats.low)}</span>
          <span className="text-text-muted">Posisi harga terakhir dalam rentang</span>
          <span className="text-state-positive">Tertinggi {num(stats.high)}</span>
        </div>
        <div className="relative mt-space-6 h-2 w-full rounded-full bg-gradient-to-r from-state-negative/40 via-surface-container to-state-positive/40">
          <span
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-text-primary"
            style={{ left: `calc(${Math.max(1, Math.min(99, stats.positionPct))}% - 2px)` }}
            aria-hidden
          />
        </div>
        <div className="mt-space-4 flex justify-between font-label-mono-sm text-label-mono-sm text-text-muted">
          <span>{stats.lowBar.date}</span>
          <span className="font-bold text-text-primary">{num(stats.last)}</span>
          <span>{stats.highBar.date}</span>
        </div>
      </div>

      {/* Up vs down days as a single proportional bar. */}
      <div className="mt-space-16">
        <div className="flex items-baseline justify-between font-label-mono-sm text-label-mono-sm">
          <span className="text-text-muted">Hari naik vs turun</span>
          <span>
            <span className="font-bold text-state-positive">{stats.up} naik</span>
            <span className="text-text-muted"> &middot; </span>
            <span className="font-bold text-state-negative">{stats.down} turun</span>
            {stats.flat > 0 && <span className="text-text-muted"> &middot; {stats.flat} datar</span>}
          </span>
        </div>
        <div className="mt-space-6 flex h-2 w-full overflow-hidden rounded-full bg-surface-container">
          <span className="bg-state-positive" style={{ width: `${(stats.up / total) * 100}%` }} />
          <span className="bg-text-muted/40" style={{ width: `${(stats.flat / total) * 100}%` }} />
          <span className="bg-state-negative" style={{ width: `${(stats.down / total) * 100}%` }} />
        </div>
      </div>

      <div className="mt-space-16 grid grid-cols-2 gap-space-8 sm:grid-cols-3">
        <div className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
          <span className="block font-body-sm text-body-sm text-text-muted">Jarak dari tertinggi</span>
          <span className="font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-state-negative">
            {(stats.fromHigh * 100).toFixed(2)}%
          </span>
        </div>
        <div
          className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8"
          title="Simpangan baku perubahan harga harian pada periode ini — ukuran sebaran, bukan perkiraan risiko ke depan"
        >
          <span className="block font-body-sm text-body-sm text-text-muted">Simpangan harian</span>
          <span className="font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-text-primary">
            {(stats.stdDev * 100).toFixed(2)}%
          </span>
        </div>
        <div className="col-span-2 rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8 sm:col-span-1">
          <span className="block font-body-sm text-body-sm text-text-muted">Rata-rata volume harian</span>
          <span className="font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-text-primary">
            {(stats.avgVolume / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt
          </span>
        </div>
      </div>

      <p className="mt-space-8 flex items-start gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
        <span>
          Semua angka menggambarkan apa yang <strong className="text-text-secondary">sudah terjadi</strong> pada periode di grafik, bukan
          perkiraan pergerakan berikutnya. Ikut berubah saat rentang waktu diganti.
        </span>
      </p>
    </div>
  );
}
