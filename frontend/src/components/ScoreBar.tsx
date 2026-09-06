import { GlossaryTerm } from './GlossaryTerm';

interface ScoreBarProps {
  /** 0-100 */
  value: number;
  label?: string;
  /** Kunci kamus istilah. Bila diisi, label mendapat tooltip penjelasan. */
  glossaryTerm?: string;
}

// Nada bar mengikuti token sistem desain, bukan skala neutral bawaan Tailwind.
function barTone(value: number): string {
  if (value >= 66) return 'bg-state-positive';
  if (value >= 33) return 'bg-state-warning';
  return 'bg-state-negative';
}

export function ScoreBar({ value, label, glossaryTerm }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-space-12">
      {label && (
        <span className="w-44 shrink-0 font-body-sm text-body-sm text-text-secondary">
          {glossaryTerm ? <GlossaryTerm term={glossaryTerm}>{label}</GlossaryTerm> : label}
        </span>
      )}
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
        <div className={`h-full rounded-full ${barTone(clamped)}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-label-mono-md text-label-mono-md font-bold tabular-nums text-text-primary">
        {clamped.toFixed(0)}
      </span>
    </div>
  );
}
