import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { SymbolSearch } from './components/SymbolSearch';
import { Wordmark } from './components/Wordmark';
import { TickerTape } from './components/TickerTape';
import { getMarketStatus, type MarketStatus } from './lib/marketHours';
import { getMarketOverview } from './api/client';
import type { IndexPoint, TickerTapeRow } from './api/types';

// Recomputed every minute from the viewer's own clock — a schedule check,
// not a live feed, so it only ever claims "pasar buka/tutup", never
// "real-time".
function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState(() => getMarketStatus());
  useEffect(() => {
    const id = setInterval(() => setStatus(getMarketStatus()), 60_000);
    return () => clearInterval(id);
  }, []);
  return status;
}

// Nav items ported verbatim from the reference mockup's header. Three of the
// five don't correspond to a page that exists yet — kept as visible, inert
// links (rather than deleted) per the plan to build them out later; see the
// pending-features list.
const NAV_LINKS: { label: string; to: string | null }[] = [
  { label: 'Ringkasan Pasar', to: '/' },
  { label: 'Sektor IDX', to: null },
  { label: 'Chart & Analisis', to: null },
  { label: 'Berita', to: '/berita' },
  { label: 'Komunitas & Ide', to: null },
];

export function App() {
  const marketStatus = useMarketStatus();
  // Which nav item is highlighted follows the actual route, rather than a
  // flag pinned to the home link (which left /berita with no active state).
  const { pathname } = useLocation();
  const [ihsg, setIhsg] = useState<IndexPoint[]>([]);
  const [tickerRows, setTickerRows] = useState<TickerTapeRow[]>([]);

  useEffect(() => {
    getMarketOverview()
      .then((d) => {
        setIhsg(d.ihsg);
        setTickerRows(d.tickerTape);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background-base text-on-surface">
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-background-base/95 backdrop-blur">
        <div className="flex h-nav-height items-center justify-between gap-space-16 px-space-16">
          <div className="flex flex-1 items-center gap-space-16">
            <Link to="/" className="flex shrink-0 items-center gap-space-8">
              <Wordmark />
              <span className="rounded bg-surface-container px-space-4 py-space-2 font-label-mono-sm text-label-mono-sm text-primary-container">
                IDX
              </span>
            </Link>

            <div className="hidden max-w-md flex-1 lg:block">
              <SymbolSearch />
            </div>
          </div>

          <nav className="hidden items-center gap-space-20 xl:flex" aria-label="Navigasi utama">
            {NAV_LINKS.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  aria-current={pathname === item.to ? 'page' : undefined}
                  className={
                    pathname === item.to
                      ? 'border-b-2 border-primary-container py-[14px] font-semibold text-text-primary transition-colors'
                      : 'py-[14px] font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-on-surface'
                  }
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  title="Segera hadir"
                  className="cursor-not-allowed py-[14px] font-body-sm text-body-sm text-on-surface-variant/50"
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>

          <div className="flex items-center gap-space-12">
            <span
              className={`hidden items-center gap-space-6 rounded border px-space-8 py-space-4 md:flex ${
                marketStatus.open ? 'border-border-subtle bg-surface-card' : 'border-border-subtle bg-surface-card'
              }`}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${marketStatus.open ? 'animate-pulse bg-state-positive' : 'bg-text-muted'}`} />
              <span className="font-label-mono-sm text-label-mono-sm uppercase text-text-secondary">{marketStatus.label}</span>
            </span>

          </div>
        </div>

        <TickerTape ihsg={ihsg} rows={tickerRows} />
      </header>

      {/* The disclaimer footer is `sticky bottom-0`, so it floats over whatever
          is at the bottom of the viewport. Without this reserve the last rows
          of the page sit permanently underneath it and can never be read. */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
