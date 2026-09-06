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

// Every nav item goes somewhere real. The mockup's five included three that had
// no destination; inert menu items read as a half-finished prototype, so they
// were resolved rather than left greyed out:
//   Sektor IDX      -> jangkar ke section "Ikhtisar Sub-Sektor IDX" di dashboard
//   Screener        -> jangkar ke panel "Screener Emiten" di dashboard
//   Chart & Analisis-> dihapus; chart hidup di dalam tiap halaman emiten,
//                      dicapai lewat pencarian atau screener
//   Komunitas & Ide -> dihapus; tidak ada datanya sama sekali
const NAV_LINKS: { label: string; to: string }[] = [
  { label: 'Ringkasan Pasar', to: '/' },
  { label: 'Sektor IDX', to: '/#sektor-idx' },
  { label: 'Screener', to: '/#screener-emiten' },
  { label: 'Berita', to: '/berita' },
];

/** Menggulir ke elemen yang ditunjuk hash. React Router tidak melakukannya
 *  sendiri, jadi tanpa ini tautan /#sektor-idx hanya berpindah route. */
function useHashScroll(): void {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    // Section tujuan bisa belum ter-render saat data dashboard masih dimuat.
    let batal = false;
    const coba = (sisa: number) => {
      if (batal) return;
      const el = document.querySelector(hash);
      if (el) {
        // 'auto', bukan 'smooth': animasi smooth digerakkan rAF dan berhenti
        // saat tab tidak digambar, sehingga jangkar bisa diam-diam gagal.
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else if (sisa > 0) {
        setTimeout(() => coba(sisa - 1), 250);
      }
    };
    coba(12);
    return () => {
      batal = true;
    };
  }, [hash, pathname]);
}

export function App() {
  const marketStatus = useMarketStatus();
  useHashScroll();
  // Which nav item is highlighted follows the actual route, rather than a
  // flag pinned to the home link (which left /berita with no active state).
  const { pathname, hash } = useLocation();
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

          <nav className="hidden items-center gap-space-24 lg:flex" aria-label="Navigasi utama">
            {NAV_LINKS.map((item) => {
              // Jangkar dashboard tetap menyorot "Ringkasan Pasar" sebagai induknya.
              const aktif = item.to.includes('#') ? pathname === '/' && hash === `#${item.to.split('#')[1]}` : pathname === item.to && !hash;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  aria-current={aktif ? 'page' : undefined}
                  className={
                    aktif
                      ? 'whitespace-nowrap border-b-2 border-primary-container py-[13px] font-body-md text-body-md font-semibold text-text-primary transition-colors'
                      : 'whitespace-nowrap py-[13px] font-body-md text-body-md font-medium text-on-surface-variant transition-colors hover:text-text-primary'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
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

        {/* Di bawah lg, nav utama dan kolom pencarian sama-sama tersembunyi,
            sehingga ponsel praktis tidak punya navigasi sama sekali — /berita
            hanya bisa dicapai dengan mengetik URL. Baris ringkas ini menutup
            lubang itu; digulir mendatar bila tidak muat. */}
        <nav className="flex gap-space-16 overflow-x-auto border-t border-border-subtle px-space-16 py-space-8 lg:hidden" aria-label="Navigasi utama ringkas">
          {NAV_LINKS.map((item) => {
            const aktif = item.to.includes('#') ? pathname === '/' && hash === `#${item.to.split('#')[1]}` : pathname === item.to && !hash;
            return (
              <Link
                key={item.label}
                to={item.to}
                aria-current={aktif ? 'page' : undefined}
                className={
                  aktif
                    ? 'whitespace-nowrap font-body-sm text-body-sm font-semibold text-primary'
                    : 'whitespace-nowrap font-body-sm text-body-sm text-on-surface-variant'
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

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
