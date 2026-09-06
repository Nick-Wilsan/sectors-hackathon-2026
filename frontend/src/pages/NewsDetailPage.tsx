import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNewsIndex, askAboutArticle } from '../api/client';
import { FloatingAIChat } from '../components/FloatingAIChat';
import type { NewsArticleFull, NewsIndexResult } from '../api/types';

// Halaman detail berita (/berita/:id).
//
// Sectors hanya mengirim ringkasan, bukan naskah penuh: panjang `body` median
// ~720 karakter dan maksimum ~1.580. Halaman ini karena itu dirancang sebagai
// halaman KONTEKS, bukan pembaca artikel — ringkasan resmi, emiten yang
// disebut, profil isi, dan berita terkait dari korpus yang sama — dengan tautan
// jelas ke penerbit aslinya untuk naskah lengkapnya. Menyajikannya seolah
// artikel utuh akan menyesatkan sekaligus menyalin karya penerbit.
//
// Datanya diambil dari endpoint korpus yang sama dengan /berita, yang sudah
// ter-cache, sehingga membuka halaman ini berbiaya 0 kredit.

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

const TAG_TONES = [
  'bg-primary-container/15 text-primary',
  'bg-state-positive/10 text-state-positive',
  'bg-state-warning/10 text-state-warning',
  'bg-tertiary-container/15 text-tertiary',
];

function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const hours = Math.round((Date.now() - then) / 3_600_000);
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Kemarin' : `${days} hari lalu`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function readMinutes(body?: string): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Kartu ringkas untuk daftar berita terkait dan berita lainnya. */
function MiniCard({ article }: { article: NewsArticleFull }) {
  return (
    <article className="group relative flex gap-space-12 rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8 transition-colors hover:border-surface-variant">
      {article.thumbnail && (
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-surface-container">
          <img
            src={article.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{relativeTime(article.timestamp)}</span>
        <h3 className="mt-space-2 line-clamp-3 font-body-sm text-body-sm font-semibold leading-snug text-text-primary transition-colors group-hover:text-primary">
          <Link to={`/berita/${article.id}`} className="after:absolute after:inset-0 after:content-['']">
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

function GridCard({ article, tone }: { article: NewsArticleFull; tone: string }) {
  const category = article.tags?.[0];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-card transition-colors hover:border-surface-variant">
      <div className="h-32 w-full overflow-hidden bg-surface-container">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-[26px] text-outline-variant">newspaper</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-space-12">
        <div className="flex items-center justify-between gap-space-8">
          <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{relativeTime(article.timestamp)}</span>
          {category && (
            <span className={`truncate rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold uppercase ${tone}`}>
              {category}
            </span>
          )}
        </div>
        <h3 className="mt-space-8 line-clamp-3 font-headline-sm text-[13px] font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          <Link to={`/berita/${article.id}`} className="after:absolute after:inset-0 after:content-['']">
            {article.title}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-space-8 pt-space-12 font-label-mono-sm text-label-mono-sm text-text-muted">
          <span className="truncate">{hostOf(article.source)}</span>
          <span className="material-symbols-outlined shrink-0 text-[16px] transition-colors group-hover:text-primary">arrow_forward</span>
        </div>
      </div>
    </article>
  );
}

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<NewsIndexResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getNewsIndex()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat berita'))
      .finally(() => setLoading(false));
  }, []);

  // Setiap perpindahan artikel memulai bacaan baru — tanpa ini, klik dari
  // "Berita Lainnya" di dasar halaman mendarat di tengah halaman berikutnya.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const article = useMemo(() => data?.articles.find((a) => a.id === id), [data, id]);

  /** Berita terkait, diperingkat: emiten yang sama dulu, lalu sub-sektor, lalu topik. */
  const related = useMemo(() => {
    if (!data || !article) return [];
    const symbols = new Set(article.symbols ?? []);
    const subs = new Set(article.subSector ?? []);
    const tags = new Set(article.tags ?? []);

    return data.articles
      .filter((a) => a.id !== article.id)
      .map((a) => {
        let skor = 0;
        if ((a.symbols ?? []).some((s) => symbols.has(s))) skor += 4;
        if ((a.subSector ?? []).some((s) => subs.has(s))) skor += 2;
        skor += (a.tags ?? []).filter((t) => tags.has(t)).length;
        return { a, skor };
      })
      .filter((r) => r.skor > 0)
      .sort((x, y) => y.skor - x.skor || y.a.timestamp.localeCompare(x.a.timestamp))
      .slice(0, 4)
      .map((r) => r.a);
  }, [data, article]);

  const others = useMemo(() => {
    if (!data || !article) return [];
    const relatedIds = new Set(related.map((r) => r.id));
    return data.articles.filter((a) => a.id !== article.id && !relatedIds.has(a.id)).slice(0, 4);
  }, [data, article, related]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-32">
        <p className="font-body-md text-body-md text-text-muted">Memuat berita…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-32">
        <p className="font-body-md text-body-md text-state-negative">{error}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-32">
        <div className="mx-auto max-w-xl rounded-lg border border-border-subtle bg-surface-card p-space-32 text-center">
          <span className="material-symbols-outlined text-[32px] text-outline-variant">search_off</span>
          <h1 className="mt-space-8 font-headline-md text-headline-md text-text-primary">Berita tidak ditemukan</h1>
          <p className="mt-space-8 font-body-md text-body-md text-text-secondary">
            Artikel ini tidak ada di korpus {data?.corpusSize ?? 0} berita terakhir. Korpus hanya memuat warta terbaru,
            jadi tautan lama bisa keluar dari daftar.
          </p>
          <Link
            to="/berita"
            className="mt-space-16 inline-flex items-center gap-space-6 rounded bg-primary-container px-space-16 py-space-8 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke indeks berita
          </Link>
        </div>
      </div>
    );
  }

  const subSector = article.subSector?.[0];
  const focusAxes = Object.entries(article.dimension ?? {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const mentions = (symbol: string) => data!.articles.filter((a) => a.symbols?.includes(symbol)).length;

  return (
    <div className="mx-auto max-w-[1440px] px-space-16 py-space-16">
      <nav className="flex flex-wrap items-center gap-space-6 font-label-mono-sm text-label-mono-sm text-text-muted">
        <Link to="/" className="hover:text-text-secondary">
          Ringkasan Pasar
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link to="/berita" className="hover:text-text-secondary">
          Indeks Berita
        </Link>
        {subSector && (
          <>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{titleCase(subSector)}</span>
          </>
        )}
      </nav>

      <div className="mt-space-12 grid grid-cols-1 items-start gap-gutter-terminal lg:grid-cols-3">
        {/* ---------- kolom artikel ---------- */}
        <article className="lg:col-span-2">
          <div className="rounded-lg border border-border-subtle bg-surface-card p-space-16">
            <div className="flex flex-wrap items-center gap-space-8">
              {(article.tags ?? []).slice(0, 3).map((t, i) => (
                <span
                  key={t}
                  className={`rounded px-space-8 py-space-4 font-label-mono-sm text-label-mono-sm font-bold uppercase ${TAG_TONES[i % TAG_TONES.length]}`}
                >
                  {t}
                </span>
              ))}
            </div>

            <h1 className="mt-space-12 font-headline-lg text-headline-lg text-text-primary">{article.title}</h1>

            <div className="mt-space-12 flex flex-wrap items-center gap-space-16 border-y border-border-subtle py-space-8 font-label-mono-sm text-label-mono-sm text-text-muted">
              <span className="flex items-center gap-space-4">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {absoluteTime(article.timestamp)} WIB
              </span>
              <span className="flex items-center gap-space-4">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                {readMinutes(article.body)} menit baca
              </span>
              <a
                href={article.source}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-space-4 text-primary transition-colors hover:text-accent-hover"
              >
                <span className="material-symbols-outlined text-[14px]">public</span>
                {hostOf(article.source)}
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(window.location.href).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="ml-auto flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 text-text-secondary transition-colors hover:border-surface-variant"
              >
                <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'link'}</span>
                {copied ? 'Tautan disalin' : 'Salin tautan'}
              </button>
            </div>

            {article.thumbnail && (
              <figure className="mt-space-16">
                <div className="overflow-hidden rounded bg-surface-container">
                  <img
                    src={article.thumbnail}
                    alt=""
                    className="max-h-96 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <figcaption className="mt-space-6 font-label-mono-sm text-label-mono-sm text-text-muted">
                  Gambar dari {hostOf(article.source)}
                </figcaption>
              </figure>
            )}

            {article.body && (
              <p className="mt-space-16 border-l-2 border-primary-container pl-space-12 font-body-lg text-body-lg leading-relaxed text-text-secondary">
                {article.body}
              </p>
            )}

            {/* Pernyataan tegas: ini ringkasan, bukan naskah penuh. */}
            <div className="mt-space-16 flex flex-col gap-space-12 rounded border border-border-subtle bg-background-base p-space-16 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-space-8">
                <span className="material-symbols-outlined mt-[1px] shrink-0 text-[18px] text-state-warning">info</span>
                <p className="font-body-sm text-body-sm leading-snug text-text-secondary">
                  Yang tampil di atas adalah <span className="font-bold text-text-primary">ringkasan resmi dari Sectors</span>,
                  bukan naskah lengkap. Stocket tidak menyalin isi artikel — baca versi utuhnya di penerbit aslinya.
                </p>
              </div>
              <a
                href={article.source}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center justify-center gap-space-6 rounded bg-primary-container px-space-16 py-space-8 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover"
              >
                Baca di {hostOf(article.source)}
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </div>

            {(article.tags?.length ?? 0) > 0 && (
              <div className="mt-space-16 flex flex-wrap items-center gap-space-6">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-text-muted">Topik terkait</span>
                {(article.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="rounded border border-border-subtle px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm text-text-secondary"
                  >
                    #{t.replace(/\s+/g, '')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ---------- berita lainnya ---------- */}
          {others.length > 0 && (
            <section className="mt-space-16">
              <div className="flex items-center justify-between gap-space-12">
                <h2 className="font-headline-md text-headline-md text-text-primary">Berita Lainnya</h2>
                <Link
                  to="/berita"
                  className="flex items-center gap-space-4 font-body-sm text-body-sm text-primary transition-colors hover:text-accent-hover"
                >
                  Lihat semua
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
              <div className="mt-space-12 grid grid-cols-1 gap-gutter-terminal sm:grid-cols-2 xl:grid-cols-4">
                {others.map((a, i) => (
                  <GridCard key={a.id} article={a} tone={TAG_TONES[i % TAG_TONES.length]} />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ---------- sidebar ---------- */}
        <aside className="flex flex-col gap-gutter-terminal">
          {(article.symbols?.length ?? 0) > 0 && (
            <section className="rounded-lg border border-border-subtle bg-surface-card p-space-16">
              <div className="flex items-center gap-space-8">
                <span className="material-symbols-outlined text-[18px] text-primary">workspaces</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Emiten yang Disebut</h2>
              </div>
              <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
                Angka di kanan adalah jumlah berita yang menyebut emiten itu pada korpus {data!.corpusSize} artikel.
              </p>
              <ul className="mt-space-12 flex flex-col gap-space-6">
                {(article.symbols ?? []).map((s) => {
                  const ticker = s.replace('.JK', '');
                  return (
                    <li key={s}>
                      <Link
                        to={`/emiten/${ticker}`}
                        className="flex items-center justify-between gap-space-8 rounded border border-border-subtle/60 bg-surface-container-lowest px-space-12 py-space-8 transition-colors hover:border-primary-container"
                      >
                        <span className="flex items-center gap-space-8">
                          <span className="font-label-mono-md text-label-mono-md font-bold text-primary">{ticker}</span>
                          <span className="font-body-sm text-body-sm text-text-muted">Buka analisis</span>
                        </span>
                        <span className="shrink-0 rounded bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
                          {mentions(s)} berita
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {focusAxes.length > 0 && (
            <section className="rounded-lg border border-border-subtle bg-surface-card p-space-16">
              <div className="flex items-center gap-space-8">
                <span className="material-symbols-outlined text-[18px] text-state-warning">donut_small</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Profil Isi Artikel</h2>
              </div>
              <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
                Sumbu topik dari Sectors: sisi perusahaan mana yang dibahas artikel ini. Deskripsi isi, bukan penilaian
                atas sahamnya.
              </p>
              <ul className="mt-space-12 flex flex-col gap-space-8">
                {focusAxes.map(([axis, score]) => (
                  <li key={axis}>
                    <div className="flex items-baseline justify-between gap-space-8">
                      <span className="font-body-sm text-body-sm text-text-primary">{DIMENSION_LABELS[axis] ?? titleCase(axis)}</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-text-secondary">
                        {score >= 2 ? 'Utama' : 'Sekunder'}
                      </span>
                    </div>
                    <div className="mt-space-4 h-1 w-full overflow-hidden rounded-full bg-background-base">
                      <div
                        className={score >= 2 ? 'h-full rounded-full bg-state-warning' : 'h-full rounded-full bg-outline-variant'}
                        style={{ width: score >= 2 ? '100%' : '50%' }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section className="rounded-lg border border-border-subtle bg-surface-card p-space-16">
              <div className="flex items-center gap-space-8">
                <span className="material-symbols-outlined text-[18px] text-state-positive">hub</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Berita Terkait</h2>
              </div>
              <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
                Diurutkan dari kesamaan emiten, lalu sub-sektor, lalu topik.
              </p>
              <div className="mt-space-12 flex flex-col gap-space-8">
                {related.map((a) => (
                  <MiniCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          <section className="flex items-start gap-space-8 rounded-lg border border-border-subtle bg-surface-card p-space-16">
            <span className="material-symbols-outlined mt-[1px] shrink-0 text-[18px] text-primary">verified_user</span>
            <p className="font-body-sm text-body-sm leading-snug text-text-muted">
              Stocket mengelompokkan dan menghitung warta pasar, tidak menerbitkannya. Seluruh isi dan hak ciptanya milik
              media penerbit masing-masing. Halaman ini bukan rekomendasi investasi.
            </p>
          </section>
        </aside>
      </div>

      {/* Cakupan satu artikel. Batasnya dijaga di sisi server
          (ai/newsAiContext.ts): boleh meringkas isi dan menjelaskan istilah,
          dilarang menyimpulkan sentimen atau dampaknya terhadap harga, dan
          teks artikel diperlakukan sebagai data — bukan sebagai perintah. */}
      <FloatingAIChat
        key={article.id}
        scopeLabel="Berita Ini"
        scopeNote="Membahas isi artikel dan berita terkait — tidak menilai sentimen maupun dampaknya ke harga."
        ask={(q) => askAboutArticle(article.id!, q)}
        suggestions={[
          'Ringkas berita ini dalam bahasa sederhana',
          'Ada istilah yang tidak saya mengerti di berita ini',
          'Berita lain apa yang membahas hal serupa?',
        ]}
      />
    </div>
  );
}
