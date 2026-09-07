import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { SymbolSearch } from './components/SymbolSearch';
import { Wordmark } from './components/Wordmark';
import { TickerTape } from './components/TickerTape';
import { getMarketStatus, type MarketStatus } from './lib/marketHours';
import { useTheme } from './lib/theme';
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

/** Kunci penyimpanan posisi gulir satu halaman, dipisah per alamat. */
const kunciGulir = (pathname: string) => `gulir:${pathname}`;

/** sessionStorage melempar di sebagian konteks (mode privat tertentu, setelan
 *  yang memblokir data situs). Posisi gulir bukan hal yang layak menjatuhkan
 *  halaman, jadi kegagalannya ditelan dan perilakunya kembali ke "mulai dari
 *  atas". */
function bacaAngka(kunci: string): number | null {
  try {
    const v = sessionStorage.getItem(kunci);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function tulisAngka(kunci: string, nilai: number): void {
  try {
    sessionStorage.setItem(kunci, String(Math.round(nilai)));
  } catch {
    /* diabaikan dengan sengaja */
  }
}

/** Apakah tampilan halaman ini berasal dari muat ulang, bukan dari
 *  perpindahan halaman di dalam aplikasi. */
function berasalDariMuatUlang(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === 'reload';
  } catch {
    return false;
  }
}

// Ditangkap sekali saat modul dimuat, SEBELUM React memasang effect apa pun.
//
// Penjaga "sudah pernah dipulihkan" tidak boleh berupa useRef yang diubah di
// dalam badan effect. React StrictMode memanggil tiap effect dua kali pada mode
// pengembangan: pemanggilan pertama menghabiskan penjaganya, lalu pemanggilan
// kedua membaca penjaga yang sudah menyala dan mengambil cabang yang salah —
// halaman ikut tergulir ke puncak, persis gejala yang dikira sudah selesai.
// Keadaan di tingkat modul kebal terhadap pemanggilan ganda itu: kedua
// pemanggilan menghitung keputusan yang sama.
const PATH_AWAL = typeof window === 'undefined' ? '' : window.location.pathname;
const DARI_MUAT_ULANG = typeof window === 'undefined' ? false : berasalDariMuatUlang();
let sudahPindahHalaman = false;

/** Mengingat posisi gulir tiap halaman, dan mengembalikannya saat halaman itu
 *  dimuat ulang.
 *
 *  Perilaku bawaan peramban tidak bisa dipakai apa adanya di sini.
 *  `history.scrollRestoration` bernilai 'auto', dan pemulihannya terjadi
 *  segera setelah dokumen siap — padahal halaman emiten baru mengambil datanya
 *  sesudah itu. Pada detik pemulihan, tinggi halaman masih setinggi rangka
 *  pemuatan; panel-panelnya menyusul dan mendorong isi ke bawah, sehingga
 *  pembaca mendarat di bagian yang sama sekali lain. Itulah keluhan aslinya.
 *
 *  Percobaan pertama menyelesaikannya dengan selalu kembali ke puncak. Itu
 *  memang dapat diramalkan, tetapi salah: pembaca yang berhenti di bagian
 *  berita lalu menyegarkan halaman kehilangan tempatnya. Versi ini memulihkan
 *  posisinya, hanya saja pemulihan itu dikerjakan sendiri dan DIULANG selama
 *  halaman masih bertambah tinggi — sampai tingginya benar-benar cukup untuk
 *  menampung posisi yang dituju.
 *
 *  Tiga hal yang sengaja dibedakan:
 *
 *    - Muat ulang mengembalikan posisi. Perpindahan halaman di dalam aplikasi
 *      selalu mulai dari atas, sebab membuka emiten lain lalu mendarat di
 *      tengah halamannya adalah kejutan, bukan kemudahan.
 *    - Alamat berhash tidak disentuh; di sana melompat memang maksudnya, dan
 *      useHashScroll yang menanganinya.
 *    - Guliran dari pengguna membatalkan pemulihan yang sedang berjalan.
 *      Tanpa ini, pembaca yang langsung menggulir sendiri sesudah menyegarkan
 *      halaman akan direbut kembali oleh percobaan pemulihan berikutnya.
 *
 *  Catatan: muat ulang biasa dan muat ulang paksa tidak dapat dibedakan dari
 *  JavaScript — keduanya dilaporkan `performance` sebagai 'reload'. Yang benar-
 *  benar memulai dari puncak adalah tab baru, sebab ingatan ini disimpan di
 *  sessionStorage yang memang seumur tab. */
function useScrollMemory(): void {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  // Perekam. Ditunda 150 ms supaya satu guliran panjang tidak menulis ratusan
  // kali, dan ikut disimpan pada 'pagehide' agar gerakan terakhir sebelum
  // halaman ditinggalkan tidak hilang bersama penundaan itu.
  useEffect(() => {
    const kunci = kunciGulir(pathname);
    let tunda = 0;
    const simpanSegera = () => tulisAngka(kunci, window.scrollY);
    const simpan = () => {
      window.clearTimeout(tunda);
      tunda = window.setTimeout(simpanSegera, 150);
    };
    window.addEventListener('scroll', simpan, { passive: true });
    window.addEventListener('pagehide', simpanSegera);
    return () => {
      window.clearTimeout(tunda);
      window.removeEventListener('scroll', simpan);
      window.removeEventListener('pagehide', simpanSegera);
    };
  }, [pathname]);

  useEffect(() => {
    if (hash) return;

    if (pathname !== PATH_AWAL) sudahPindahHalaman = true;
    const perluDipulihkan = DARI_MUAT_ULANG && !sudahPindahHalaman && pathname === PATH_AWAL;

    // Sasaran dibaca sekali di sini. Pemulih di bawah menggulir sendiri,
    // guliran itu memicu perekam, dan perekam menimpa nilai tersimpan dengan
    // posisi antara — jadi nilainya harus sudah dipegang sebelum itu terjadi.
    const tujuan = perluDipulihkan ? bacaAngka(kunciGulir(pathname)) : null;
    if (tujuan === null) {
      window.scrollTo(0, 0);
      return;
    }

    let berhenti = false;
    const hentikan = () => {
      berhenti = true;
    };
    // Hanya isyarat yang benar-benar datang dari pengguna. `scrollTo` milik
    // pemulih ini ikut memicu event 'scroll', jadi 'scroll' tidak bisa dipakai
    // sebagai penanda campur tangan — ia akan membatalkan dirinya sendiri.
    window.addEventListener('wheel', hentikan, { passive: true });
    window.addEventListener('touchstart', hentikan, { passive: true });
    window.addEventListener('keydown', hentikan);

    const mulai = Date.now();
    let waktu = 0;
    const coba = () => {
      if (berhenti) return;
      const maksimum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, Math.min(tujuan, maksimum));
      // Selesai begitu halaman cukup tinggi untuk posisi yang dituju. Batas
      // 5 detik menjaga agar emiten yang panelnya gagal dimuat tidak membuat
      // percobaan ini berjalan selamanya.
      if (maksimum >= tujuan || Date.now() - mulai > 5000) return;
      waktu = window.setTimeout(coba, 100);
    };
    coba();

    return () => {
      berhenti = true;
      window.clearTimeout(waktu);
      window.removeEventListener('wheel', hentikan);
      window.removeEventListener('touchstart', hentikan);
      window.removeEventListener('keydown', hentikan);
    };
  }, [pathname, hash]);
}

export function App() {
  const marketStatus = useMarketStatus();
  const { theme, toggle: toggleTheme } = useTheme();
  useScrollMemory();
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
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
              title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
              className="flex h-8 w-8 items-center justify-center rounded border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:border-surface-variant hover:text-text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>

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
