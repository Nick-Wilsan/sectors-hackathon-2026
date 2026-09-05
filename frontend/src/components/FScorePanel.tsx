import type { FrameworkResult } from '../api/types';

/**
 * Piotroski panel, rebuilt around the score itself rather than a wall of prose.
 * The long methodology paragraph moves into a disclosure so the criteria — the
 * part a reader actually scans — sit at the top.
 */
export function FScorePanel({ framework }: { framework: FrameworkResult }) {
  const met = framework.pointsMet;
  const applicable = framework.pointsApplicable;
  const ratio = applicable > 0 ? met / applicable : 0;
  // Full class strings, not interpolated fragments: Tailwind scans source text,
  // so `text-${tone}` would never be compiled into the stylesheet.
  const TONES = {
    high: { text: 'text-state-positive', bar: 'bg-state-positive', chip: 'bg-state-positive/10 text-state-positive' },
    mid: { text: 'text-state-warning', bar: 'bg-state-warning', chip: 'bg-state-warning/10 text-state-warning' },
    low: { text: 'text-state-negative', bar: 'bg-state-negative', chip: 'bg-state-negative/10 text-state-negative' },
  } as const;
  const tone = ratio >= 0.67 ? TONES.high : ratio >= 0.34 ? TONES.mid : TONES.low;
  // The backend's classification reads "Memenuhi 3 dari 6 kriteria ... (sedang)".
  // The count is already the headline figure, so the chip keeps only the tier
  // word in the parentheses and falls back to the full string if absent.
  const tierWord = /\(([^)]+)\)\s*$/.exec(framework.classification)?.[1] ?? framework.classification;

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex items-center gap-space-8 border-b border-border-subtle pb-space-8">
        <span className="material-symbols-outlined text-[18px] text-primary-container">rule</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">{framework.frameworkName}</h2>
      </div>

      {framework.status === 'inadequate' ? (
        <p className="mt-space-12 font-body-sm text-body-sm text-text-muted">Data tidak memadai untuk klasifikasi.</p>
      ) : (
        <>
          {/* Headline score: number, segmented meter, verdict chip. */}
          <div className="mt-space-12 flex items-end justify-between gap-space-8">
            <div className="flex items-baseline gap-space-6">
              <span className={`font-display-lg text-display-lg tracking-tight tabular-nums ${tone.text}`}>{met}</span>
              <span className="font-label-mono-md text-label-mono-md text-text-muted">/ {applicable} kriteria</span>
            </div>
            <span className={`rounded px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${tone.chip}`}>
              {tierWord}
            </span>
          </div>

          {/* One segment per criterion — filled if met, hollow if not. */}
          <div className="mt-space-8 flex gap-space-4" aria-hidden>
            {Array.from({ length: applicable }).map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < met ? tone.bar : 'bg-surface-container'}`} />
            ))}
          </div>

          <ul className="mt-space-12 flex flex-col gap-space-6">
            {framework.criteria.map((c) => {
              const state = c.met === null ? 'muted' : c.met ? 'pass' : 'fail';
              return (
                <li
                  key={c.key}
                  className={`flex gap-space-8 rounded border p-space-8 ${
                    state === 'pass'
                      ? 'border-state-positive/30 bg-state-positive/5'
                      : state === 'fail'
                        ? 'border-state-negative/25 bg-state-negative/5'
                        : 'border-border-subtle/60 bg-surface-container-lowest'
                  }`}
                >
                  <span
                    className={`mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      state === 'pass'
                        ? 'bg-state-positive/20 text-state-positive'
                        : state === 'fail'
                          ? 'bg-state-negative/20 text-state-negative'
                          : 'bg-surface-container text-text-muted'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {state === 'pass' ? 'check' : state === 'fail' ? 'close' : 'remove'}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="font-body-sm text-body-sm font-semibold text-text-primary">{c.label}</p>
                    <p className="font-label-mono-sm text-label-mono-sm text-text-muted">{c.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <details className="mt-space-12 border-t border-border-subtle pt-space-8">
            <summary className="cursor-pointer font-body-sm text-body-sm text-text-secondary transition-colors hover:text-text-primary">
              Bagaimana skor ini dihitung?
            </summary>
            <p className="mt-space-6 font-body-sm text-body-sm leading-relaxed text-text-muted">{framework.frameworkDescription}</p>
          </details>
        </>
      )}
    </div>
  );
}
