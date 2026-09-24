import { Link } from 'react-router-dom';
import type { MarketAnomalyRow, MarketAnomalyScan } from '../api/types';
import { MarketContextLine, formatSignedPercent } from './MarketContextBlock';
import { GlossaryTerm } from './GlossaryTerm';

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} mlr`;
  if (abs >= 1e6) return `${(value / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (abs >= 1e3) return `${(value / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 1 })} rb`;
  return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

/** Volume metrics are share counts; the return metric is a ratio. */
function describe(metric: MarketAnomalyRow['triggered'][number]): string {
  if (metric.key === 'priceChange') {
    return `${(metric.latestValue * 100).toFixed(2)}% vs rata-rata ${(metric.baselineMean * 100).toFixed(2)}%`;
  }
  return `${formatCompact(metric.latestValue)} vs rata-rata ${formatCompact(metric.baselineMean)}`;
}

function Row({ row }: { row: MarketAnomalyRow }) {
  const symbolShort = row.symbol.replace('.JK', '');

  return (
    <div
      className={`flex flex-col gap-space-4 rounded border p-space-8 ${
        row.hasAnomaly ? 'border-state-warning/40 bg-state-warning/5' : 'border-border-subtle/60 bg-surface-container-lowest'
      }`}
    >
      <div className="flex items-baseline justify-between gap-space-8">
        <Link to={`/emiten/${symbolShort}`} className="flex min-w-0 items-baseline gap-space-6">
          <span className="shrink-0 font-headline-sm text-headline-sm font-bold text-text-primary">{symbolShort}</span>
          <span className="truncate font-body-sm text-body-sm text-text-muted">{row.companyName}</span>
        </Link>
        {row.status === 'inadequate' ? (
          <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">Data kurang</span>
        ) : row.hasAnomaly ? (
          <span className="shrink-0 rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold text-state-warning">
            Tidak biasa
          </span>
        ) : (
          <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">Normal</span>
        )}
      </div>

      {row.triggered.length > 0 ? (
        <div className="flex flex-col gap-space-2">
          {row.triggered.map((m) => (
            <p key={m.key} className="font-label-mono-sm text-label-mono-sm text-text-secondary">
              <span className="text-text-muted">{m.label}:</span> {describe(m)}{' '}
              <span className="font-bold text-state-warning">({m.zScore.toFixed(1)}σ)</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="font-label-mono-sm text-label-mono-sm text-text-muted">
          {row.status === 'inadequate' ? 'Riwayat harga belum cukup untuk diuji.' : 'Volume & pergerakan masih dalam kebiasaan emiten ini.'}
        </p>
      )}

      {/* Separates the part of the day's move the whole bourse shared from the
          part it did not — the market-wide half of "why did this move",
          measured rather than guessed. */}
      {row.marketContext && <MarketContextLine context={row.marketContext} />}
    </div>
  );
}

/**
 * F-06 applied across the day's busiest names. The point it makes is one the
 * volume table cannot: high turnover is normal for some emiten and genuinely
 * unusual for others, and only the second kind is worth a second look.
 */
export function MarketAnomalyStrip({ scan }: { scan: MarketAnomalyScan }) {
  const flagged = scan.rows.filter((r) => r.hasAnomaly).length;
  const tested = scan.rows.filter((r) => r.status === 'ok').length;
  // Sectors publishes the IHSG bar for a session later than the emiten bars,
  // so for part of the day the market comparison simply has nothing to use.
  // Say so instead of letting the promised comparison vanish without a word.
  const latestDate = scan.rows.reduce<string | null>((d, r) => (r.date && (!d || r.date > d) ? r.date : d), null);
  const indexPending = latestDate !== null && scan.rows.every((r) => r.marketContext === null);

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex flex-col gap-space-8 border-b border-border-subtle pb-space-12 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-state-warning">radar</span>
          <div>
            <div className="flex flex-wrap items-center gap-space-8">
              <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Deteksi Anomali Emiten Teramai</h2>
              <span className="rounded border border-border-subtle bg-surface-container-lowest px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm">
                <span className="font-bold tabular-nums text-state-warning">{flagged}</span>
                <span className="text-text-muted"> dari {tested} tidak biasa</span>
              </span>
              {scan.marketReturn !== null && (
                <span className="rounded border border-border-subtle bg-surface-container-lowest px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm text-text-muted">
                  <GlossaryTerm term="IHSG">IHSG</GlossaryTerm>{' '}
                  <span className="font-bold tabular-nums text-text-secondary">{formatSignedPercent(scan.marketReturn)}</span>{' '}
                  sesi ini
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-text-muted">
              Volume dan pergerakan harga hari ini diuji terhadap kebiasaan emiten itu sendiri selama 90 hari terakhir, lalu
              dibandingkan dengan pergerakan pasar pada hari yang sama.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-space-12 grid grid-cols-1 gap-space-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {scan.rows.map((row) => (
          <Row key={row.symbol} row={row} />
        ))}
      </div>

      <p className="mt-space-8 flex items-start gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="material-symbols-outlined shrink-0 text-[16px] text-primary">info</span>
        <span>
          Ambang: {scan.threshold}σ dari rata-rata 90 hari. Penyimpangan terukur saja &mdash; tidak menyatakan penyebab maupun
          arah lanjutan harga. {scan.marketContextDisclaimer}
          {indexPending && ` Data IHSG untuk sesi ${latestDate} belum tersedia dari sumber data, sehingga perbandingan dengan pasar belum dapat ditampilkan.`}
        </span>
      </p>
    </div>
  );
}
