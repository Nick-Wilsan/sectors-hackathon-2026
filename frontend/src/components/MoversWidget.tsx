import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MostTradedRow, MoverRow } from '../api/types';

interface MoversWidgetProps {
  gainers: MoverRow[];
  losers: MoverRow[];
  mostTraded: MostTradedRow[];
}

type Tab = 'gainers' | 'losers' | 'active';

const TABS: { key: Tab; label: string }[] = [
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
  { key: 'active', label: 'Teraktif' },
];

function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`font-mono text-xs tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
      {positive ? '+' : ''}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

// IDX-style tabbed widget: one card, one active dataset at a time, instead of
// several always-visible lists stacked on top of each other — denser and
// matches how idx.co.id's "Saham Teraktif" module switches between Nilai/
// Volume/Gainers/Frekuensi in place.
export function MoversWidget({ gainers, losers, mostTraded }: MoversWidgetProps) {
  const [tab, setTab] = useState<Tab>('gainers');

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-2 py-2 text-xs font-medium uppercase tracking-wide ${
              tab === t.key ? 'border-b-2 border-brand text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-neutral-800/70 px-3">
        {tab !== 'active' &&
          (tab === 'gainers' ? gainers : losers).map((r, i) => (
            <Link
              key={r.symbol}
              to={`/emiten/${r.symbol.replace('.JK', '')}`}
              className="flex items-center gap-2 py-1.5 text-xs hover:bg-neutral-800/50"
            >
              <span className="w-4 text-right text-neutral-600">{i + 1}</span>
              <span className="w-16 font-mono text-neutral-300">{r.symbol.replace('.JK', '')}</span>
              <span className="flex-1 truncate text-neutral-500">{r.companyName}</span>
              <span className="font-mono tabular-nums text-neutral-500">{r.lastClosePrice.toLocaleString('id-ID')}</span>
              <ChangeTag value={r.priceChange} />
            </Link>
          ))}

        {tab === 'active' &&
          mostTraded.map((r, i) => (
            <Link
              key={r.symbol}
              to={`/emiten/${r.symbol.replace('.JK', '')}`}
              className="flex items-center gap-2 py-1.5 text-xs hover:bg-neutral-800/50"
            >
              <span className="w-4 text-right text-neutral-600">{i + 1}</span>
              <span className="w-16 font-mono text-neutral-300">{r.symbol.replace('.JK', '')}</span>
              <span className="flex-1 truncate text-neutral-500">{r.companyName}</span>
              <span className="font-mono tabular-nums text-neutral-500">{r.price.toLocaleString('id-ID')}</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-600">
                Vol {(r.volume / 1e6).toFixed(1)}jt
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}
