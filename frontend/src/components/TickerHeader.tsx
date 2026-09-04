import type { DailyBar } from '../api/types';

interface TickerHeaderProps {
  symbol: string;
  companyName: string;
  bars: DailyBar[];
}

function fmt(n: number | null): string {
  return n === null ? '—' : n.toLocaleString('id-ID');
}

// TradingView-style OHLC info line: "O H L C ±change (±%)" from the latest
// two bars — genuinely computed from data already on the page, not decorative.
export function TickerHeader({ symbol, companyName, bars }: TickerHeaderProps) {
  const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  if (!latest) return null;

  const change = prev ? latest.close - prev.close : 0;
  const changePct = prev && prev.close !== 0 ? change / prev.close : 0;
  const positive = change >= 0;

  return (
    <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-2 sm:px-6">
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-mono font-semibold text-neutral-100">{symbol.toUpperCase()}</span>
        <span className="text-neutral-500">&middot;</span>
        <span className="text-neutral-400">{companyName}</span>
        <span className="text-neutral-500">&middot;</span>
        <span className="text-neutral-500">1D</span>
        <span className="text-neutral-500">&middot;</span>
        <span className="text-neutral-500">IDX</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 font-mono text-xs tabular-nums text-neutral-400">
        <span>
          O<span className="ml-1 text-neutral-200">{fmt(latest.open)}</span>
        </span>
        <span>
          H<span className="ml-1 text-neutral-200">{fmt(latest.high)}</span>
        </span>
        <span>
          L<span className="ml-1 text-neutral-200">{fmt(latest.low)}</span>
        </span>
        <span>
          C<span className="ml-1 text-neutral-200">{fmt(latest.close)}</span>
        </span>
        {prev && (
          <span className={positive ? 'text-emerald-400' : 'text-rose-400'}>
            {positive ? '+' : ''}
            {change.toLocaleString('id-ID')} ({positive ? '+' : ''}
            {(changePct * 100).toFixed(2)}%)
          </span>
        )}
        <span className="text-neutral-600">{latest.date}</span>
      </div>
    </div>
  );
}
