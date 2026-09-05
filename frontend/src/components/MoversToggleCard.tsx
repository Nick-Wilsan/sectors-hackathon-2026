import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MoverRow } from '../api/types';

interface MoversToggleCardProps {
  gainers: MoverRow[];
  losers: MoverRow[];
}

// Segmented Gainers/Losers toggle ported from the reference mockup's
// "Movers Harian" widget — same real 1D top-movers data the 3-card
// GAINERS/LOSERS/TERAKTIF row already fetches, just a second presentation.
export function MoversToggleCard({ gainers, losers }: MoversToggleCardProps) {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const rows = (tab === 'gainers' ? gainers : losers).slice(0, 4);

  return (
    <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16 lg:col-span-2">
      <div>
        <div className="mb-space-12 flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Movers Harian</h2>
          <div className="inline-flex rounded border border-border-subtle bg-background-base p-space-2 font-label-mono-sm text-label-mono-sm">
            <button
              type="button"
              onClick={() => setTab('gainers')}
              className={`rounded px-space-8 py-space-2 font-bold transition-colors ${
                tab === 'gainers' ? 'bg-surface-container text-state-positive' : 'text-text-muted hover:text-on-surface'
              }`}
            >
              Gainers
            </button>
            <button
              type="button"
              onClick={() => setTab('losers')}
              className={`rounded px-space-8 py-space-2 font-bold transition-colors ${
                tab === 'losers' ? 'bg-surface-container text-state-negative' : 'text-text-muted hover:text-on-surface'
              }`}
            >
              Losers
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-space-8">
          {rows.map((r) => {
            const symbolShort = r.symbol.replace('.JK', '');
            const positive = r.priceChange >= 0;
            return (
              <Link
                key={r.symbol}
                to={`/emiten/${symbolShort}`}
                className="flex items-center justify-between rounded border border-border-subtle/50 bg-surface-container-lowest p-space-6 transition-colors hover:border-surface-variant"
              >
                <div>
                  <span className="block font-headline-sm text-headline-sm font-bold text-text-primary">{symbolShort}</span>
                  <p className="font-label-mono-sm text-label-mono-sm text-text-muted">Rp {r.lastClosePrice.toLocaleString('id-ID')}</p>
                </div>
                <span
                  className={`rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${
                    positive ? 'bg-state-positive/10 text-state-positive' : 'bg-state-negative/10 text-state-negative'
                  }`}
                >
                  {positive ? '+' : ''}
                  {(r.priceChange * 100).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
