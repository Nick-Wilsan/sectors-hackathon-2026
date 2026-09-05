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

// Structure/classes ported verbatim from the reference mockup's "Indeks
// Komparasi" row — icon + label, then each index as value + %change with a
// vertical divider between entries.
export function IndexChipRow({ indexChips }: { indexChips: Record<string, IndexPoint[]> }) {
  const codes = Object.keys(indexChips).filter((c) => indexChips[c].length > 0);
  if (codes.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-8 font-label-mono-sm text-label-mono-sm">
      <div className="flex items-center gap-space-4 text-text-muted">
        <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
        <span className="font-semibold text-text-primary">Indeks Komparasi:</span>
      </div>
      <div className="flex flex-wrap items-center gap-space-12">
        {codes.map((code, i) => {
          const change = changeOf(indexChips[code]);
          const positive = change >= 0;
          return (
            <div key={code} className="contents">
              {i > 0 && <div className="h-3 w-px bg-border-subtle" />}
              <div className="flex items-center gap-space-4">
                <span className="text-text-muted">{LABELS[code] ?? code}:</span>
                <span className={`font-bold ${positive ? 'text-state-positive' : 'text-state-negative'}`}>
                  {positive ? '+' : ''}
                  {(change * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
