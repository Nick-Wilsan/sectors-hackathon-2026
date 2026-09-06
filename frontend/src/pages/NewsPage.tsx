import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNewsIndex } from '../api/client';
import type { Counted, NewsArticleFull, NewsIndexResult } from '../api/types';

// Halaman indeks berita (/berita).
//
// Semua penyaringan, pengurutan dan penomoran halaman berjalan di browser atas
// satu korpus yang diambil sekali. Sectors menagih 1 kredit per panggilan berita
// dan memotong `limit` di 30, jadi menyaring di server berarti membayar setiap
// kali pengguna mengetik. Facet di sisi kanan dihitung backend dari korpus yang
// sama, sehingga angkanya selalu cocok dengan daftar yang tampil.

const PAGE_SIZE = 8;

// Kelas Tailwind tidak boleh dirangkai dinamis (Tailwind memindai teks sumber),
// jadi setiap nada warna ditulis utuh di peta statis.
const TAG_TONES = [
  'bg-primary-container/15 text-primary',
  'bg-state-positive/10 text-state-positive',
  'bg-state-warning/10 text-state-warning',
  'bg-tertiary-container/15 text-tertiary',
];

const BAR_TONES: Record<string, string> = {
  primary: 'bg-primary-container',
  positive: 'bg-state-positive',
  warning: 'bg-state-warning',
  muted: 'bg-outline-variant',
};

// Sumbu topik milik Sectors, dialihbahasakan. "technical" sengaja dinamai
// "Pergerakan Harga" — deskripsi isi artikel, bukan pandangan atas arahnya.
const DIMENSION_LABELS: Record<string, string> = {
  financials: 'Kinerja Keuangan',
  future: 'Rencana & Prospek',
  ownership: 'Kepemilikan',
  valuation: 'Valuasi',
  management: 'Manajemen',
  dividend: 'Dividen',
  technical: 'Pergerakan Harga',
  sustainability: 'Keberlanjutan',
};

function titleCase(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} mnt lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Kemarin' : `${days} hari lalu`;
}

function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Perkiraan waktu baca dari panjang ringkasan — 200 kata per menit. */
function readMinutes(body?: string): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function Thumb({ article, className }: { article: NewsArticleFull; className: string }) {
  if (!article.thumbnail) {
    return (
      <div className={`flex items-center justify-center bg-surface-container ${className}`}>
        <span className="material-symbols-outlined text-[28px] text-outline-variant">newspaper</span>
      </div>
    );
  }
  return (
    <div className={`overflow-hidden bg-surface-container ${className}`}>
      <img
        src={article.thumbnail}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          // Thumbnail mati harus jadi bidang kosong yang rapi, bukan ikon rusak.
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

function SymbolChips({ symbols, max = 4 }: { symbols?: string[]; max?: number }) {
  const list = (symbols ?? []).slice(0, max);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-space-4">
      {list.map((s) => (
        <Link
          key={s}
          to={`/emiten/${s.replace('.JK', '')}`}
          className="rounded border border-border-subtle bg-background-base px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold text-primary transition-colors hover:border-primary-container hover:text-accent-hover"
        >
          {s.replace('.JK', '')}
        </Link>
      ))}
      {(symbols?.length ?? 0) > max && (
        <span className="font-label-mono-sm text-label-mono-sm text-text-muted">+{(symbols?.length ?? 0) - max}</span>
      )}
    </div>
  );
}

function FacetPanel({
  icon,
  title,
  note,
  rows,
  tone,
  renderKey,
  linkTo,
}: {
  icon: string;
  title: string;
  note: string;
  rows: Counted[];
  tone: keyof typeof BAR_TONES;
  renderKey?: (key: string) => string;
  linkTo?: (key: string) => string;
}) {
  if (rows.length === 0) return null;
  const max = rows[0].count;

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-card p-space-16">
      <div className="flex items-center gap-space-8">
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
        <h3 className="font-headline-sm text-headline-sm text-text-primary">{title}</h3>
      </div>
      <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">{note}</p>

      <ul className="mt-space-12 flex flex-col gap-space-8">
        {rows.map((row, i) => {
          const label = renderKey ? renderKey(row.key) : row.key;
          const pct = Math.round((row.count / max) * 100);
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-space-8">
                <span className="flex min-w-0 items-baseline gap-space-6">
                  <span className="font-label-mono-sm text-label-mono-sm text-text-muted">#{i + 1}</span>
                  <span className="truncate font-body-sm text-body-sm text-text-primary">{label}</span>
                </span>
                <span className="shrink-0 font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
                  {row.count}
                </span>
              </div>
              <div className="mt-space-4 h-1 w-full overflow-hidden rounded-full bg-background-base">
                <div className={`h-full rounded-full ${BAR_TONES[tone]}`} style={{ width: `${pct}%` }} />
              </div>
            </>
          );

          return (
            <li key={row.key}>
              {linkTo ? (
                <Link to={linkTo(row.key)} className="block rounded px-space-4 py-space-2 transition-colors hover:bg-surface-container-lowest">
                  {body}
                </Link>
              ) : (
                <div className="px-space-4 py-space-2">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Kartu memakai pola stretched link: judulnya yang menjadi anchor dan
// melebar menutupi seluruh kartu lewat ::after, sementara chip emiten berdiri
// di atasnya. Membungkus seluruh kartu dengan <a> membuat tautan emiten
// bersarang di dalam tautan artikel — HTML tidak valid dan React menolaknya.
function ArticleCard({ article, tone }: { article: NewsArticleFull; tone: string }) {
  const category = article.tags?.[0];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-card transition-colors hover:border-surface-variant">
      <Thumb article={article} className="h-36 w-full" />
      <div className="flex flex-1 flex-col p-space-12">
        <div className="flex items-center justify-between gap-space-8">
          <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{relativeTime(article.timestamp)}</span>
          {category && (
            <span className={`truncate rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold uppercase ${tone}`}>
              {category}
            </span>
          )}
        </div>

        <h3 className="mt-space-8 font-headline-sm text-[13px] font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          <Link to={`/berita/${article.id}`} className="after:absolute after:inset-0 after:content-['']">
            {article.title}
          </Link>
        </h3>

        {article.body && (
          <p className="mt-space-6 line-clamp-3 font-body-sm text-body-sm leading-relaxed text-text-muted">{article.body}</p>
        )}

        <div className="relative z-10 mt-auto flex items-end justify-between gap-space-8 pt-space-12">
          <SymbolChips symbols={article.symbols} max={3} />
          <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">{readMinutes(article.body)} mnt</span>
        </div>
      </div>
    </article>
  );
}

function ArticleRow({ article, tone }: { article: NewsArticleFull; tone: string }) {
  const category = article.tags?.[0];
  return (
    <article className="group relative flex gap-space-12 rounded-lg border border-border-subtle bg-surface-card p-space-12 transition-colors hover:border-surface-variant">
      <Thumb article={article} className="hidden h-20 w-32 shrink-0 rounded sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-space-8">
          <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{absoluteTime(article.timestamp)}</span>
          {category && (
            <span className={`rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold uppercase ${tone}`}>
              {category}
            </span>
          )}
          <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{hostOf(article.source)}</span>
        </div>
        <h3 className="mt-space-6 font-headline-sm text-[14px] font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          <Link to={`/berita/${article.id}`} className="after:absolute after:inset-0 after:content-['']">
            {article.title}
          </Link>
        </h3>
        {article.body && (
          <p className="mt-space-4 line-clamp-2 font-body-sm text-body-sm leading-relaxed text-text-muted">{article.body}</p>
        )}
        <div className="relative z-10 mt-space-8">
          <SymbolChips symbols={article.symbols} max={5} />
        </div>
      </div>
    </article>
  );
}

function HeroArticle({ article }: { article: NewsArticleFull }) {
  const focus = Object.entries(article.dimension ?? {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([axis]) => DIMENSION_LABELS[axis] ?? titleCase(axis));

  return (
    <article className="group overflow-hidden rounded-lg border border-border-subtle bg-surface-card">
      <div className="relative">
        <Thumb article={article} className="h-56 w-full sm:h-72" />
        <div className="absolute left-space-12 top-space-12 flex flex-wrap gap-space-6">
          {(article.tags ?? []).slice(0, 2).map((t, i) => (
            <span
              key={t}
              className={`rounded px-space-8 py-space-4 font-label-mono-sm text-label-mono-sm font-bold uppercase backdrop-blur ${TAG_TONES[i % TAG_TONES.length]}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="p-space-16">
        <div className="flex flex-wrap items-center gap-space-12 font-label-mono-sm text-label-mono-sm text-text-muted">
          <span className="flex items-center gap-space-4">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {absoluteTime(article.timestamp)} WIB
          </span>
          <span className="flex items-center gap-space-4">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            {readMinutes(article.body)} menit baca
          </span>
          <span className="flex items-center gap-space-4">
            <span className="material-symbols-outlined text-[14px]">public</span>
            {hostOf(article.source)}
          </span>
        </div>

        <h2 className="mt-space-12 font-headline-lg text-headline-lg text-text-primary">
          <Link to={`/berita/${article.id}`} className="transition-colors hover:text-primary">
            {article.title}
          </Link>
        </h2>

        {article.body && (
          <p className="mt-space-12 font-body-md text-body-md leading-relaxed text-text-secondary">{article.body}</p>
        )}

        {focus.length > 0 && (
          <div className="mt-space-16 flex flex-wrap items-center gap-space-8 rounded border border-border-subtle bg-background-base p-space-12">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-text-muted">Fokus isi</span>
            {focus.map((f) => (
              <span key={f} className="rounded bg-surface-container px-space-8 py-space-2 font-body-sm text-body-sm text-text-primary">
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="mt-space-16 flex flex-wrap items-center justify-between gap-space-12">
          <div className="flex items-center gap-space-8">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-text-muted">Emiten terkait</span>
            <SymbolChips symbols={article.symbols} max={5} />
          </div>
          <Link
            to={`/berita/${article.id}`}
            className="flex items-center gap-space-6 rounded bg-primary-container px-space-16 py-space-8 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover"
          >
            Baca selengkapnya
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Emiten yang paling sering muncul di korpus, dengan berita terbarunya. */
/** Emiten yang paling sering muncul di korpus, dengan berita terbarunya. */
function MostCoveredPanel({ data }: { data: NewsIndexResult }) {
  const top = data.aggregates.symbols.slice(0, 5);
  const latestFor = (symbol: string) => data.articles.find((a) => a.symbols?.includes(symbol));

  /** Topik yang paling sering menyertai emiten ini di korpus — label faktual, bukan penilaian. */
  const topTagFor = (symbol: string): string | undefined => {
    const counts = new Map<string, number>();
    for (const a of data.articles) {
      if (!a.symbols?.includes(symbol)) continue;
      for (const t of a.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  };

  const fetched = new Date(data.fetchedAt);
  const fetchedLabel = Number.isNaN(fetched.getTime())
    ? ''
    : fetched.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <section className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface-card p-space-16">
      <div className="flex items-center justify-between gap-space-8">
        <div className="flex items-center gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-state-warning">local_fire_department</span>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Paling Banyak Diberitakan</h2>
        </div>
        {/* Bukan "real-time" seperti mockup: ini waktu korpus terakhir diambil. */}
        <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">Per {fetchedLabel}</span>
      </div>
      <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
        Dihitung dari jumlah artikel yang menyebut tiap emiten pada {data.corpusSize} berita terakhir. Frekuensi
        pemberitaan, bukan penilaian atas sahamnya.
      </p>

      <ul className="mt-space-12 flex flex-1 flex-col gap-space-8">
        {top.map((row, i) => {
          const article = latestFor(row.key);
          const ticker = row.key.replace('.JK', '');
          const tag = topTagFor(row.key);

          return (
            <li
              key={row.key}
              className="group relative flex flex-1 gap-space-12 overflow-hidden rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8 transition-colors hover:border-surface-variant"
            >
              {article && <Thumb article={article} className="h-full min-h-[72px] w-28 shrink-0 rounded" />}

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-space-8">
                  <span className="flex min-w-0 items-center gap-space-6">
                    <span className="font-label-mono-sm text-label-mono-sm text-text-muted">#{i + 1}</span>
                    <Link
                      to={`/emiten/${ticker}`}
                      className="relative z-10 font-label-mono-md text-label-mono-md font-bold text-primary hover:text-accent-hover"
                    >
                      {ticker}
                    </Link>
                  </span>
                  <span className="shrink-0 rounded bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
                    {row.count} berita
                  </span>
                </div>

                {article && (
                  <h3 className="mt-space-4 line-clamp-2 font-body-sm text-body-sm font-semibold leading-snug text-text-primary transition-colors group-hover:text-primary">
                    <Link to={`/berita/${article.id}`} className="after:absolute after:inset-0 after:content-['']">
                      {article.title}
                    </Link>
                  </h3>
                )}

                <div className="mt-auto flex items-center justify-between gap-space-8 pt-space-6">
                  {tag ? (
                    <span className="truncate font-label-mono-sm text-label-mono-sm text-state-positive">{tag}</span>
                  ) : (
                    <span />
                  )}
                  <span className="material-symbols-outlined shrink-0 text-[16px] text-text-muted transition-colors group-hover:text-primary">
                    arrow_forward
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Menutup ruang kosong di dasar panel sekaligus menyatakan asal datanya. */}
      <div className="mt-space-12 flex items-start gap-space-8 rounded border border-border-subtle bg-background-base p-space-12">
        <span className="material-symbols-outlined mt-[1px] shrink-0 text-[16px] text-primary">verified_user</span>
        <p className="font-body-sm text-body-sm leading-snug text-text-muted">
          Seluruh warta tertaut ke {data.aggregates.sources.length} media penerbit aslinya. Stocket mengelompokkan dan
          menghitung, tidak menyalin isi artikel.
        </p>
      </div>
    </section>
  );
}

export function NewsPage() {
  const [data, setData] = useState<NewsIndexResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [subSector, setSubSector] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<'baru' | 'lama'>('baru');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);

  useEffect(() => {
    getNewsIndex()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat berita'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const rows = data.articles.filter((a) => {
      if (subSector && !(a.subSector ?? []).includes(subSector)) return false;
      if (tag && !(a.tags ?? []).includes(tag)) return false;
      if (q) {
        const haystack = `${a.title} ${a.body ?? ''} ${(a.symbols ?? []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return rows.sort((a, b) =>
      sort === 'baru' ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp),
    );
  }, [data, query, subSector, tag, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function resetPageAnd(fn: () => void) {
    fn();
    setPage(0);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-32">
        <p className="font-body-md text-body-md text-text-muted">Memuat indeks berita…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-32">
        <p className="font-body-md text-body-md text-state-negative">{error ?? 'Gagal memuat berita'}</p>
      </div>
    );
  }

  // Sorotan hanya tampil pada daftar yang belum disaring: begitu pengguna
  // menyaring, daftarnya sendiri yang jadi pokok. Satu penanda dipakai untuk
  // menampilkan hero DAN memotongnya dari grid — dua kondisi terpisah sempat
  // membuat artikel teratas tampil dua kali.
  const showHero = safePage === 0 && !query && !tag && !subSector;
  const hero = showHero ? filtered[0] : undefined;
  const gridArticles = hero ? visible.slice(1) : visible;

  return (
    <div className="mx-auto max-w-[1440px] px-space-16 py-space-16">
      <nav className="flex items-center gap-space-6 font-label-mono-sm text-label-mono-sm text-text-muted">
        <Link to="/" className="hover:text-text-secondary">
          Ringkasan Pasar
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-text-secondary">Indeks Berita Emiten</span>
      </nav>

      <header className="mt-space-12 flex flex-col gap-space-16 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="font-display-lg text-display-lg text-text-primary">Warta Pasar &amp; Kabar Emiten</h1>
          <p className="mt-space-8 font-body-md text-body-md leading-relaxed text-text-secondary">
            Kabar emiten Bursa Efek Indonesia dari <span className="font-bold text-text-primary">{data.aggregates.sources.length} media</span>,
            dikelompokkan ulang menurut emiten, sub-sektor dan topik yang benar-benar disebut di dalamnya. Tautan selalu
            mengarah ke penerbit aslinya.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-space-8">
          {[
            { label: 'Artikel dimuat', value: data.corpusSize.toLocaleString('id-ID') },
            { label: 'Emiten disebut', value: data.aggregates.symbols.length.toLocaleString('id-ID') },
            { label: 'Sub-sektor', value: data.aggregates.subSectors.length.toLocaleString('id-ID') },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border-subtle bg-surface-card px-space-12 py-space-8">
              <dt className="font-label-mono-sm text-label-mono-sm uppercase text-text-muted">{s.label}</dt>
              <dd className="mt-space-2 font-label-mono-lg text-label-mono-lg tabular-nums text-text-primary">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Toolbar penyaring — seluruhnya bekerja di browser, tanpa biaya kredit. */}
      <div className="mt-space-16 flex flex-col gap-space-8 rounded-lg border border-border-subtle bg-surface-card p-space-12 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-space-8 rounded border border-border-subtle bg-background-base px-space-12 py-space-8 focus-within:border-primary-container">
          <span className="material-symbols-outlined text-[18px] text-text-muted">search</span>
          <input
            value={query}
            onChange={(e) => resetPageAnd(() => setQuery(e.target.value))}
            placeholder="Cari judul, isi, atau kode emiten (mis. BMRI)"
            className="w-full bg-transparent font-body-md text-body-md text-text-primary outline-none placeholder:text-text-muted"
          />
        </label>

        <select
          value={subSector}
          onChange={(e) => resetPageAnd(() => setSubSector(e.target.value))}
          className="rounded border border-border-subtle bg-background-base px-space-12 py-space-8 font-body-md text-body-md text-text-primary outline-none focus:border-primary-container"
        >
          <option value="">Semua sub-sektor ({data.aggregates.subSectors.length})</option>
          {data.aggregates.subSectors.map((s) => (
            <option key={s.key} value={s.key}>
              {titleCase(s.key)} ({s.count})
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => resetPageAnd(() => setSort(e.target.value as 'baru' | 'lama'))}
          className="rounded border border-border-subtle bg-background-base px-space-12 py-space-8 font-body-md text-body-md text-text-primary outline-none focus:border-primary-container"
        >
          <option value="baru">Terbaru dulu</option>
          <option value="lama">Terlama dulu</option>
        </select>

        <div className="flex items-center gap-space-2 rounded border border-border-subtle bg-background-base p-space-2">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            title="Tampilan kartu"
            className={
              view === 'grid'
                ? 'rounded bg-surface-container px-space-8 py-space-6 text-primary'
                : 'rounded px-space-8 py-space-6 text-text-muted hover:text-text-secondary'
            }
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            title="Tampilan daftar"
            className={
              view === 'list'
                ? 'rounded bg-surface-container px-space-8 py-space-6 text-primary'
                : 'rounded px-space-8 py-space-6 text-text-muted hover:text-text-secondary'
            }
          >
            <span className="material-symbols-outlined text-[18px]">view_list</span>
          </button>
        </div>
      </div>

      {/* Chip topik dari tag asli sumber berita, bukan kategori karangan. */}
      <div className="mt-space-8 flex flex-wrap items-center gap-space-6">
        <span className="font-label-mono-sm text-label-mono-sm uppercase text-text-muted">Topik</span>
        <button
          type="button"
          onClick={() => resetPageAnd(() => setTag(''))}
          className={
            tag === ''
              ? 'rounded bg-primary-container px-space-8 py-space-4 font-label-mono-sm text-label-mono-sm font-bold text-background-base'
              : 'rounded border border-border-subtle px-space-8 py-space-4 font-label-mono-sm text-label-mono-sm text-text-secondary hover:border-surface-variant'
          }
        >
          Semua
        </button>
        {data.aggregates.tags.slice(0, 9).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => resetPageAnd(() => setTag(tag === t.key ? '' : t.key))}
            className={
              tag === t.key
                ? 'rounded bg-primary-container px-space-8 py-space-4 font-label-mono-sm text-label-mono-sm font-bold text-background-base'
                : 'rounded border border-border-subtle px-space-8 py-space-4 font-label-mono-sm text-label-mono-sm text-text-secondary hover:border-surface-variant'
            }
          >
            {t.key} <span className="tabular-nums text-text-muted">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Sorotan: artikel terbaru + emiten yang paling sering diberitakan. */}
      {hero && (
        <div className="mt-space-16 grid grid-cols-1 items-start gap-gutter-terminal lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeroArticle article={hero} />
          </div>
          <MostCoveredPanel data={data} />
        </div>
      )}

      <div className="mt-space-24 flex items-center justify-between gap-space-12">
        <div className="flex items-baseline gap-space-8">
          <h2 className="font-headline-md text-headline-md text-text-primary">Daftar Berita</h2>
          <span className="rounded bg-surface-container px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
            {filtered.length} dari {data.corpusSize} artikel
          </span>
        </div>
        {(query || tag || subSector) && (
          <button
            type="button"
            onClick={() =>
              resetPageAnd(() => {
                setQuery('');
                setTag('');
                setSubSector('');
              })
            }
            className="flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 font-body-sm text-body-sm text-text-secondary hover:border-surface-variant"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Hapus penyaring
          </button>
        )}
      </div>

      <div className="mt-space-12 grid grid-cols-1 items-start gap-gutter-terminal lg:grid-cols-3">
        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border-subtle bg-surface-card p-space-32 text-center">
              <span className="material-symbols-outlined text-[32px] text-outline-variant">search_off</span>
              <p className="mt-space-8 font-body-md text-body-md text-text-secondary">
                Tidak ada artikel yang cocok dengan penyaring ini.
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-gutter-terminal sm:grid-cols-2">
              {gridArticles.map((a, i) => (
                <ArticleCard key={a.source} article={a} tone={TAG_TONES[i % TAG_TONES.length]} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-gutter-terminal">
              {gridArticles.map((a, i) => (
                <ArticleRow key={a.source} article={a} tone={TAG_TONES[i % TAG_TONES.length]} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="mt-space-16 flex items-center justify-between gap-space-8">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-12 py-space-6 font-body-sm text-body-sm text-text-secondary transition-colors enabled:hover:border-surface-variant disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                Sebelumnya
              </button>

              <span className="font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">
                Halaman {safePage + 1} dari {pageCount}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-12 py-space-6 font-body-sm text-body-sm text-text-secondary transition-colors enabled:hover:border-surface-variant disabled:opacity-30"
              >
                Selanjutnya
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </nav>
          )}
        </div>

        <aside className="flex flex-col gap-gutter-terminal">
          <FacetPanel
            icon="tag"
            title="Topik Terbanyak"
            note="Tag asli dari media penerbit, dihitung pada korpus ini."
            rows={data.aggregates.tags.slice(0, 6)}
            tone="primary"
          />
          <FacetPanel
            icon="workspaces"
            title="Emiten Paling Sering Disebut"
            note="Klik untuk membuka halaman analisis emitennya."
            rows={data.aggregates.symbols.slice(0, 6)}
            tone="positive"
            renderKey={(k) => k.replace('.JK', '')}
            linkTo={(k) => `/emiten/${k.replace('.JK', '')}`}
          />
          <FacetPanel
            icon="donut_small"
            title="Fokus Pemberitaan"
            note="Sumbu topik dari Sectors — sisi perusahaan mana yang paling banyak dibahas."
            rows={data.aggregates.dimensions}
            tone="warning"
            renderKey={(k) => DIMENSION_LABELS[k] ?? titleCase(k)}
          />
          <FacetPanel
            icon="newspaper"
            title="Media Penerbit"
            note="Seluruh artikel tertaut ke sumber aslinya, tidak disalin."
            rows={data.aggregates.sources.slice(0, 6)}
            tone="muted"
          />
        </aside>
      </div>
    </div>
  );
}
