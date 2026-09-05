import type { IndexPoint, TickerTapeRow } from '../api/types';

// Continuous scrolling strip directly under the header — CSS-only marquee
// (duplicated content + keyframe translate), no JS animation loop. Classes
// match the reference mockup's ticker tape verbatim (font-label-mono-sm,
// state-positive/negative pill badges, #0d0d0d strip background).
export function TickerTape({ ihsg, rows }: { ihsg: IndexPoint[]; rows: TickerTapeRow[] }) {
  const ihsgLast = ihsg[ihsg.length - 1]?.price;
  const ihsgPrev = ihsg[ihsg.length - 2]?.price;
  const ihsgChange = ihsgPrev ? (ihsgLast - ihsgPrev) / ihsgPrev : null;

  const items: { label: string; price: number | null; change: number | null }[] = [
    { label: 'IHSG', price: ihsgLast ?? null, change: ihsgChange },
    ...rows.map((r) => ({ label: r.symbol, price: r.price, change: r.change })),
  ];

  const track = (
    <div className="flex shrink-0 items-center gap-space-24 pr-space-24">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-space-8">
          <span className="whitespace-nowrap font-label-mono-sm text-label-mono-sm font-bold text-text-primary">{item.label}</span>
          {item.price !== null ? (
            <>
              <span className="whitespace-nowrap font-label-mono-sm text-label-mono-sm text-on-surface">
                {item.label === 'IHSG' ? item.price.toFixed(2) : `Rp ${item.price.toLocaleString('id-ID')}`}
              </span>
              {item.change !== null && (
                <span
                  className={`whitespace-nowrap rounded px-space-4 py-space-2 font-label-mono-sm text-label-mono-sm ${
                    item.change >= 0 ? 'bg-state-positive/10 text-state-positive' : 'bg-state-negative/10 text-state-negative'
                  }`}
                >
                  {item.change >= 0 ? '+' : ''}
                  {(item.change * 100).toFixed(2)}%
                </span>
              )}
            </>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-ticker-tape-height items-center overflow-hidden border-t border-border-subtle bg-[#0d0d0d] px-space-16">
      <div className="flex w-max animate-[ticker-scroll_35s_linear_infinite] motion-reduce:animate-none">
        {track}
        {track}
      </div>
    </div>
  );
}
