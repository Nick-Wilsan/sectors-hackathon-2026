import { Link } from 'react-router-dom';
import type { MostTradedRow, MoverRow } from '../api/types';

function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`font-mono text-xs tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
      {positive ? '+' : ''}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

interface MoverListCardProps {
  title: string;
  rows: MoverRow[];
}

function MoverListCard({ title, rows }: MoverListCardProps) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </div>
      <div className="divide-y divide-neutral-800/70 px-2">
        {rows.map((r, i) => (
          <Link
            key={r.symbol}
            to={`/emiten/${r.symbol.replace('.JK', '')}`}
            className="flex items-center gap-1.5 py-1.5 text-xs hover:bg-neutral-800/50"
          >
            <span className="w-3 shrink-0 text-right text-[10px] text-neutral-600">{i + 1}</span>
            <span className="w-14 shrink-0 truncate font-mono text-neutral-300">{r.symbol.replace('.JK', '')}</span>
            <span className="w-16 shrink-0 truncate text-[10px] text-neutral-600">{r.companyName}</span>
            <span className="ml-auto shrink-0 font-mono tabular-nums text-neutral-500">
              {r.lastClosePrice.toLocaleString('id-ID')}
            </span>
            <ChangeTag value={r.priceChange} />
          </Link>
        ))}
      </div>
    </div>
  );
}

interface MostTradedCardProps {
  rows: MostTradedRow[];
}

function MostTradedCard({ rows }: MostTradedCardProps) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
        Teraktif
      </div>
      <div className="divide-y divide-neutral-800/70 px-2">
        {rows.map((r, i) => (
          <Link
            key={r.symbol}
            to={`/emiten/${r.symbol.replace('.JK', '')}`}
            className="flex items-center gap-1.5 py-1.5 text-xs hover:bg-neutral-800/50"
          >
            <span className="w-3 shrink-0 text-right text-[10px] text-neutral-600">{i + 1}</span>
            <span className="w-14 shrink-0 truncate font-mono text-neutral-300">{r.symbol.replace('.JK', '')}</span>
            <span className="w-16 shrink-0 truncate text-[10px] text-neutral-600">{r.companyName}</span>
            <span className="ml-auto shrink-0 font-mono tabular-nums text-neutral-500">
              {r.price.toLocaleString('id-ID')}
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-neutral-600">
              {(r.volume / 1e6).toFixed(1)}jt
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface MoversWidgetProps {
  gainers: MoverRow[];
  losers: MoverRow[];
  mostTraded: MostTradedRow[];
}

// Three narrow cards side by side (not a tab switcher) — all three datasets
// visible at once fills the width with real content instead of leaving one
// wide list with dead space between the name and the numbers.
export function MoversWidget({ gainers, losers, mostTraded }: MoversWidgetProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <MoverListCard title="Gainers (1D)" rows={gainers} />
      <MoverListCard title="Losers (1D)" rows={losers} />
      <MostTradedCard rows={mostTraded} />
    </div>
  );
}
