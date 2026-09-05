interface ScoreBarProps {
  /** 0-100 */
  value: number;
  label?: string;
}

function barColor(value: number): string {
  if (value >= 66) return 'bg-emerald-500';
  if (value >= 33) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function ScoreBar({ value, label }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3">
      {label && <span className="w-40 shrink-0 text-sm text-neutral-400">{label}</span>}
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-800">
        <div className={`h-full rounded-full ${barColor(clamped)}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-base font-bold tabular-nums text-neutral-100">
        {clamped.toFixed(0)}
      </span>
    </div>
  );
}
