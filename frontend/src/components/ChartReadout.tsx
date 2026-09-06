import type { ReadoutBar } from './PriceChart';

interface Props {
  symbol: string;
  bar: ReadoutBar | null;
}

function num(value: number): string {
  return value.toLocaleString('id-ID');
}

/**
 * The mockup's "B / T / R / P" strip under the chart toolbar. Values follow the
 * crosshair, so hovering any candle reads out that day rather than only the
 * latest one — which is the whole point of the row in a real terminal.
 */
export function ChartReadout({ symbol, bar }: Props) {
  const up = bar ? bar.close >= bar.open : true;
  const tone = up ? 'text-state-positive' : 'text-state-negative';

  return (
    <div className="flex flex-wrap items-center gap-x-space-12 gap-y-space-2 border-b border-border-subtle bg-surface-card px-space-12 py-space-6 font-label-mono-sm text-label-mono-sm">
      <span className="font-bold text-text-primary">{symbol.toUpperCase()}</span>
      <span className="text-text-muted">1H &middot; IDX</span>

      {bar ? (
        <>
          <span className="text-text-muted">{bar.date}</span>
          <span className="text-text-muted">
            B: <span className={`tabular-nums ${tone}`}>{num(bar.open)}</span>
          </span>
          <span className="text-text-muted">
            T: <span className={`tabular-nums ${tone}`}>{num(bar.high)}</span>
          </span>
          <span className="text-text-muted">
            R: <span className={`tabular-nums ${tone}`}>{num(bar.low)}</span>
          </span>
          <span className="text-text-muted">
            P: <span className={`tabular-nums ${tone}`}>{num(bar.close)}</span>
          </span>
          {bar.movingAverages.map((ma, i) => (
            <span key={ma.label} className="text-text-muted">
              {ma.label}: <span className="tabular-nums" style={{ color: i === 0 ? 'var(--color-state-warning)' : 'var(--color-accent-hover)' }}>{num(Math.round(ma.value))}</span>
            </span>
          ))}
          <span className="ml-auto text-text-muted">
            Vol: <span className="tabular-nums text-text-secondary">{(bar.volume / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt</span>
          </span>
        </>
      ) : (
        <span className="text-text-muted">Arahkan kursor ke grafik untuk membaca nilai harian.</span>
      )}
    </div>
  );
}
