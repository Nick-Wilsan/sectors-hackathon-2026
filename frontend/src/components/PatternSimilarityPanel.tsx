import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPatternSimilarity } from '../api/client';
import type { PatternSimilarityResult } from '../api/types';

interface PatternSimilarityPanelProps {
  symbol: string;
  /** `card` wraps the panel in the dashboard's standard panel shell; `plain` is for pages that supply their own. */
  variant?: 'card' | 'plain';
}

// F-09 is optional/P4 and each fresh call can cost real Sectors credits
// (one per not-yet-cached peer's price history) — loaded on demand only,
// never automatically on page view. That deliberate restraint is why the
// idle state has to describe the feature properly: it is the only thing a
// visitor sees until they ask for it.
export function PatternSimilarityPanel({ symbol, variant = 'plain' }: PatternSimilarityPanelProps) {
  const [result, setResult] = useState<PatternSimilarityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setResult(await getPatternSimilarity(symbol));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kemiripan pola');
    } finally {
      setLoading(false);
    }
  }

  const shell = variant === 'card' ? 'rounded border border-border-subtle bg-surface-card p-space-16' : 'mt-space-24';

  return (
    <section className={shell}>
      <div className="flex items-start gap-space-8 border-b border-border-subtle pb-space-8">
        <span className="material-symbols-outlined text-[18px] text-primary-container">timeline</span>
        <div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Kemiripan Pola Lintas Saham</h2>
          <p className="font-body-sm text-body-sm text-text-muted">
            Mencari periode historis pada emiten lain di sub-sektor yang sama yang bentuk pergerakan harganya paling menyerupai 20 hari terakhir{' '}
            {symbol.toUpperCase()}.
          </p>
        </div>
      </div>

      {!result && (
        <div className="mt-space-12 flex flex-wrap items-center gap-space-8">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-space-4 rounded bg-primary-container px-space-12 py-space-6 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            {loading ? 'Mencari pola serupa...' : 'Cari pola serupa'}
          </button>
          <span className="font-label-mono-sm text-label-mono-sm text-text-muted">
            Dijalankan atas permintaan &mdash; setiap pencarian menarik riwayat harga emiten pembanding.
          </span>
        </div>
      )}

      {error && (
        <p className="mt-space-12 rounded border border-state-negative/40 bg-state-negative/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-negative">
          {error}
        </p>
      )}

      {result && result.status === 'inadequate' && (
        <p className="mt-space-12 font-body-sm text-body-sm text-text-muted">Data harga belum cukup untuk membandingkan pola.</p>
      )}

      {result && result.status === 'ok' && (
        <>
          <p className="mt-space-12 rounded border border-state-warning/40 bg-state-warning/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-warning">
            {result.warning}
          </p>
          <div className="mt-space-8 flex flex-col gap-space-6">
            {result.matches.map((m, i) => (
              <Link
                key={i}
                to={`/emiten/${m.symbol.replace('.JK', '')}`}
                className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8 transition-colors hover:border-surface-variant"
              >
                <div className="flex items-baseline justify-between gap-space-8">
                  <span className="flex min-w-0 items-baseline gap-space-6">
                    <span className="shrink-0 font-headline-sm text-headline-sm font-bold text-text-primary">{m.symbol.replace('.JK', '')}</span>
                    <span className="truncate font-body-sm text-body-sm text-text-muted">{m.companyName}</span>
                  </span>
                  <span className="shrink-0 rounded bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold tabular-nums text-primary">
                    {(m.similarity * 100).toFixed(0)}% mirip
                  </span>
                </div>
                <p className="mt-space-4 font-label-mono-sm text-label-mono-sm text-text-secondary">
                  <span className="text-text-muted">Periode serupa:</span> {m.matchStartDate} s/d {m.matchEndDate}.{' '}
                  {m.outcomeChangePercent === null
                    ? `Belum ada ${m.outcomeWindowDays} hari data setelah periode tersebut.`
                    : `${m.outcomeWindowDays} hari setelahnya, harga berubah ${(m.outcomeChangePercent * 100).toFixed(2)}%.`}
                </p>
              </Link>
            ))}
            {result.matches.length === 0 && (
              <p className="font-body-sm text-body-sm text-text-muted">Tidak ada emiten pembanding yang cukup datanya.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
