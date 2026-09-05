import { Link } from 'react-router-dom';
import type { ValuationRelativeToPeers, ValuationSpotlightRow } from '../api/types';

// Real per-company P/E vs peer-group average P/E (same fiscal year), from
// the Sectors API's own `valuation` report section — not a sector-wide
// aggregate (the API doesn't expose one, unlike the reference mockup's
// "Valuasi Sektor vs Historis") and not a judgment on whether the price is
// "cheap" or "expensive": strictly a factual comparison to peers. Bar fill
// is the P/E-to-peer-average ratio, capped for display.
const LABELS: Record<ValuationRelativeToPeers, string> = {
  'below-average': 'Di bawah rata-rata peer',
  'in-line': 'Sesuai rata-rata peer',
  'above-average': 'Di atas rata-rata peer',
  unknown: 'Data tidak tersedia',
};

const BAR_COLORS: Record<ValuationRelativeToPeers, string> = {
  'below-average': 'bg-state-positive',
  'in-line': 'bg-state-warning',
  'above-average': 'bg-state-negative',
  unknown: 'bg-border-subtle',
};

const SYMBOL_COLORS: Record<ValuationRelativeToPeers, string> = {
  'below-average': 'text-state-positive',
  'in-line': 'text-state-warning',
  'above-average': 'text-state-negative',
  unknown: 'text-text-primary',
};

function Row({ row }: { row: ValuationSpotlightRow }) {
  // A negative P/E means the company posted a loss that year — the ratio
  // itself is not a meaningful "cheap vs expensive" signal (nor is a peer
  // average dragged negative by other loss-making peers), so this renders
  // as a distinct "not meaningful" state instead of a bar/number that would
  // otherwise be visually nonsensical (e.g. a rose-colored bar sized off a
  // negative-over-negative ratio).
  const meaningful = row.pe !== null && row.pePeerAvg !== null && row.pe >= 0 && row.pePeerAvg > 0;
  const ratio = meaningful ? row.pe! / row.pePeerAvg! : null;
  const barWidth = ratio !== null ? Math.max(4, Math.min(100, ratio * 50)) : 0;

  return (
    <div>
      <div className="mb-space-4 flex items-center justify-between font-label-mono-sm text-label-mono-sm">
        <Link
          to={`/emiten/${row.symbol.replace('.JK', '')}`}
          className={`truncate underline decoration-dotted underline-offset-4 hover:opacity-80 ${SYMBOL_COLORS[row.relativeToPeers]}`}
        >
          {row.symbol.replace('.JK', '')} <span className="font-body-sm text-body-sm text-text-muted no-underline">{row.companyName}</span>
        </Link>
        {meaningful ? (
          <span className="shrink-0 font-bold text-text-primary">
            {row.pe!.toFixed(1)}x <span className="font-normal text-text-muted">/ peer {row.pePeerAvg!.toFixed(1)}x</span>
          </span>
        ) : (
          <span className="shrink-0 text-text-muted">—</span>
        )}
      </div>
      {meaningful ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div className={`h-full rounded-full ${BAR_COLORS[row.relativeToPeers]}`} style={{ width: `${barWidth}%` }} />
          </div>
          <span className="mt-space-2 block font-label-mono-sm text-label-mono-sm text-text-muted">
            Status: {LABELS[row.relativeToPeers]}
            {row.year && ` (tahun buku ${row.year})`}
          </span>
        </>
      ) : (
        <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">
          Rasio P/E tidak bermakna — laba negatif{row.year && ` (tahun buku ${row.year})`}
        </span>
      )}
    </div>
  );
}

export function ValuationSpotlight({ rows }: { rows: ValuationSpotlightRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16 lg:col-span-3">
      <div>
        <div className="mb-space-12 flex items-center justify-between">
          <div className="flex items-center gap-space-6">
            <span className="material-symbols-outlined text-[18px] text-state-warning">speed</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Valuasi vs Rata-Rata Peer</h2>
          </div>
          <span className="font-label-mono-sm text-label-mono-sm font-semibold text-primary">P/E Ratio</span>
        </div>
        <div className="flex flex-col gap-space-12 font-body-sm text-body-sm">
          {rows.map((r) => (
            <Row key={r.symbol} row={r} />
          ))}
        </div>
      </div>
      <div className="mt-space-8 border-t border-border-subtle pt-space-8">
        <p className="font-body-sm text-body-sm text-text-muted">
          <span className="font-medium text-text-primary">Tips Pemula:</span> P/E dibandingkan terhadap rata-rata peer di sub-sektor yang sama
          (bukan histori 5 tahun — data itu tidak disediakan Sectors API).
        </p>
      </div>
    </div>
  );
}
