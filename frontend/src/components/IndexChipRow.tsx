import type { IndexPoint } from '../api/types';

const LABELS: Record<string, string> = {
  lq45: 'LQ45',
  idx30: 'IDX30',
  kompas100: 'KOMPAS100',
  idxbumn20: 'IDXBUMN20',
  srikehati: 'SRI-KEHATI',
};

function changeOf(points: IndexPoint[]): number {
  if (points.length < 2) return 0;
  const last = points[points.length - 1].price;
  const prev = points[points.length - 2].price;
  return prev ? (last - prev) / prev : 0;
}

// Matches Sectors.app's "Top Indices" chip grid — several benchmark indices
// at a glance, not just IHSG.
export function IndexChipRow({ indexChips }: { indexChips: Record<string, IndexPoint[]> }) {
  const codes = Object.keys(indexChips).filter((c) => indexChips[c].length > 0);
  if (codes.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {codes.map((code) => {
        const change = changeOf(indexChips[code]);
        const positive = change >= 0;
        return (
          <div
            key={code}
            className="flex shrink-0 flex-col rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              {LABELS[code] ?? code}
            </span>
            <span className={`font-mono text-sm font-bold tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {positive ? '+' : ''}
              {(change * 100).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
