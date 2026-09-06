import { Link } from 'react-router-dom';
import type { SectorSpotlightCard } from '../api/types';

// Tier color reflects the split between healthy (score >= 66) and critical
// (score < 33) companies in the group — not an average score, which would
// be mathematically stuck near 50 for every sub-sector (percentile ranks
// averaged across the group that defines them cancel out to ~50 regardless
// of the sector's actual fundamentals).
function tierColor(card: SectorSpotlightCard): string {
  if (card.scoredCount === 0) return 'bg-surface-container-high';
  if (card.healthyCount > card.criticalCount) return 'bg-emerald-500';
  if (card.criticalCount > card.healthyCount) return 'bg-rose-500';
  return 'bg-amber-500';
}

// Badge in the mockup's top-right corner is a live price-change % — data
// this sub-sector view doesn't have (no aggregate price feed). This shows
// the share of scored companies that are "sehat" (score >= 66) instead:
// a real number in the same visual slot, not a fabricated price change.
function HealthShareBadge({ card }: { card: SectorSpotlightCard }) {
  if (card.scoredCount === 0) return null;
  const pct = Math.round((card.healthyCount / card.scoredCount) * 100);
  const positive = card.healthyCount >= card.criticalCount;
  return (
    <span
      className={`shrink-0 rounded px-space-4 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${
        positive ? 'bg-state-positive/10 text-state-positive' : 'bg-state-negative/10 text-state-negative'
      }`}
      title="Persentase emiten berskor sehat (>=66) dari yang berhasil dinilai"
    >
      {pct}% sehat
    </span>
  );
}

function Card({ card }: { card: SectorSpotlightCard }) {
  return (
    <div className="relative overflow-hidden rounded border border-border-subtle bg-surface-card p-space-12">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${tierColor(card)}`} />
      {/* Badge dropped to the sub-line: spelling out "sehat" made it wide
          enough that sharing the title row truncated sector names like
          "Makanan & Minuman" down to a few characters. */}
      <span className="block truncate font-headline-sm text-headline-sm font-bold text-text-primary" title={card.label}>
        {card.label}
      </span>
      <div className="mt-space-2 flex items-center justify-between gap-space-4">
        <p className="truncate font-body-sm text-body-sm text-text-muted">{card.groupSize} emiten dinilai</p>
        <HealthShareBadge card={card} />
      </div>
      {card.scoredCount > 0 && (
        <p className="mt-space-4 font-label-mono-sm text-label-mono-sm tabular-nums">
          <span className="text-state-positive">{card.healthyCount} sehat</span>
          <span className="text-text-muted"> &middot; </span>
          <span className="text-state-negative">{card.criticalCount} kritis</span>
        </p>
      )}

      <div className="mt-space-16 flex flex-col gap-space-6 border-t border-border-subtle/60 pt-space-8 font-label-mono-sm text-label-mono-sm">
        {card.topCompany && (
          <div className="flex items-center justify-between gap-space-4">
            <span className="shrink-0 text-text-muted">Top Leader</span>
            <Link
              to={`/emiten/${card.topCompany.symbol.replace('.JK', '')}`}
              className="truncate font-bold text-state-positive hover:text-accent-hover"
            >
              {card.topCompany.symbol.replace('.JK', '')} {card.topCompany.score.toFixed(0)}
            </Link>
          </div>
        )}
        {card.laggardCompany && (
          <div className="flex items-center justify-between gap-space-4">
            <span className="shrink-0 text-text-muted">Terlemah</span>
            <Link
              to={`/emiten/${card.laggardCompany.symbol.replace('.JK', '')}`}
              className="truncate font-bold text-state-negative hover:text-accent-hover"
            >
              {card.laggardCompany.symbol.replace('.JK', '')} {card.laggardCompany.score.toFixed(0)}
            </Link>
          </div>
        )}
        {!card.topCompany && <p className="text-text-muted">Data tidak memadai untuk sub-sektor ini.</p>}
      </div>
    </div>
  );
}

// Reuses F-01's composite score across a small curated set of well-known
// sub-sectors — "Skor" here is our own fundamental composite score, not a
// price-movement ranking, so it stays honest about what it measures.
export function SectorSpotlightGrid({ cards }: { cards: SectorSpotlightCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-space-8 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.subsector} card={c} />
      ))}
    </div>
  );
}
