import { useEffect, useState } from 'react';
import { getEmitenNews } from '../api/client';
import type { NewsArticleFull, NewsTopics } from '../api/types';

// Sectors tags every article, including a directional sentiment tag. Those are
// stripped here: printing a "Bullish" chip on our own card would read as this
// product taking a view on the price, which PRD B-02 forbids. Topical tags
// (earnings, dividend, regulation, ...) are the source's own labels and stay.
const SENTIMENT_TAGS = new Set(['bullish', 'bearish', 'neutral']);

const TAG_TONES = [
  'bg-primary-container/15 text-primary',
  'bg-state-positive/10 text-state-positive',
  'bg-state-warning/10 text-state-warning',
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const hours = Math.round((Date.now() - then) / 3_600_000);
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Kemarin' : `${days} hari lalu`;
}

function Card({ article, tone }: { article: NewsArticleFull; tone: string }) {
  const topical = (article.tags ?? []).filter((t) => !SENTIMENT_TAGS.has(t.toLowerCase()));
  const category = topical[0];

  return (
    <a
      href={article.source}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded border border-border-subtle/60 bg-surface-container-lowest transition-colors hover:border-surface-variant"
    >
      {article.thumbnail && (
        <div className="h-28 w-full overflow-hidden bg-surface-container">
          <img
            src={article.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // A dead thumbnail should collapse, not leave a broken-image box.
              (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-space-12">
        <div className="flex items-center justify-between gap-space-8">
          {category ? (
            <span className={`truncate rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold uppercase ${tone}`}>
              {category}
            </span>
          ) : (
            <span />
          )}
          <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">{relativeTime(article.timestamp)}</span>
        </div>

        <h3 className="mt-space-8 font-headline-sm text-[13px] font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          {article.title}
        </h3>

        {article.body && <p className="mt-space-6 line-clamp-3 font-body-sm text-body-sm leading-relaxed text-text-muted">{article.body}</p>}

        <div className="mt-space-8 flex items-center gap-space-4 border-t border-border-subtle/40 pt-space-6 font-label-mono-sm text-label-mono-sm text-text-muted">
          <span className="material-symbols-outlined text-[14px]">link</span>
          <span className="truncate">{topical.slice(1, 3).join(' · ') || 'Sumber berita'}</span>
        </div>
      </div>
    </a>
  );
}

// Sumbu topik milik Sectors, dialihbahasakan. "technical" dinamai "Pergerakan
// Harga" — deskripsi isi artikel, bukan pandangan atas arah harganya.
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

export function EmitenNewsPanel({ symbol }: { symbol: string }) {
  const [articles, setArticles] = useState<NewsArticleFull[] | null>(null);
  const [topics, setTopics] = useState<NewsTopics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No synchronous reset here: the parent remounts this panel with key={symbol},
  // so state starts fresh per emiten and the effect only ever writes async.
  useEffect(() => {
    getEmitenNews(symbol, 12)
      .then((r) => {
        // Dua belas artikel diambil untuk sebaran topik yang bermakna, tetapi
        // hanya enam yang ditampilkan sebagai kartu agar panel tidak melebar.
        setArticles(r.articles.slice(0, 6));
        setTopics(r.topics);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat berita emiten'));
  }, [symbol]);

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex flex-col gap-space-8 border-b border-border-subtle pb-space-12 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">newspaper</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Kabar Emiten &mdash; {symbol.toUpperCase()}</h2>
            <p className="font-body-sm text-body-sm text-text-muted">
              Artikel yang menyebut emiten ini, beserta label topik dari sumber berita.
            </p>
          </div>
        </div>
        {articles && <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">{articles.length} artikel</span>}
      </div>

      {/* Menjawab "sisi perusahaan mana yang sedang banyak diberitakan" tanpa
          pengguna harus membaca semua artikel. Hitungan kemunculan, bukan
          penilaian atas kualitas manajemen maupun prospeknya. */}
      {topics && topics.dimensions.length > 0 && (
        <div className="mt-space-12 grid grid-cols-1 gap-space-8 lg:grid-cols-2">
          <div className="flex h-full flex-col rounded border border-border-subtle bg-surface-container-lowest p-space-12">
          <div className="flex flex-wrap items-baseline justify-between gap-space-8">
            <span className="font-table-header text-table-header uppercase text-text-muted">Fokus pemberitaan</span>
            <span className="font-label-mono-sm text-label-mono-sm text-text-muted">dari 12 artikel terakhir</span>
          </div>
          <div className="mt-space-8 flex flex-col gap-space-6">
            {topics.dimensions.slice(0, 5).map((d) => {
              const pct = Math.round((d.count / topics.dimensions[0].count) * 100);
              return (
                <div key={d.key} className="flex items-center gap-space-8">
                  <span className="w-40 shrink-0 truncate font-body-sm text-body-sm text-text-secondary">
                    {DIMENSION_LABELS[d.key] ?? d.key}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-background-base">
                    <span className="block h-full rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-16 shrink-0 text-right font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">
                    {d.count} artikel
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-auto pt-space-8 font-body-sm text-body-sm text-text-muted">
            Menunjukkan seberapa sering tiap sisi perusahaan dibahas media, bukan menilai baik atau buruknya.
          </p>
          </div>

          {/* Separuh kanan: label topik yang dilekatkan sumber berita pada
              artikel-artikel itu. Datanya ikut terkirim di `topics.tags` pada
              permintaan yang sama dan selama ini terbuang — jadi kolom ini
              tidak menambah satu pun panggilan API. Bedanya dengan kolom kiri:
              kiri menyebut SISI perusahaan yang dibahas, kanan menyebut
              kata kunci yang benar-benar dipakai media. */}
          <div
            className={`flex flex-col rounded border border-border-subtle bg-surface-container-lowest p-space-12 ${
              topics.tags.length > 0 ? 'h-full' : 'self-start'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-space-8">
              <span className="font-table-header text-table-header uppercase text-text-muted">Label yang paling sering muncul</span>
              <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{topics.tags.length} label</span>
            </div>
            {topics.tags.length > 0 ? (
              <div className="flex flex-1 flex-col">
                <div className="mt-space-8 flex flex-wrap gap-space-4">
                  {topics.tags.slice(0, 12).map((t) => (
                    <span
                      key={t.key}
                      className="inline-flex items-center gap-space-4 rounded border border-border-subtle bg-background-base px-space-6 py-space-2 font-body-sm text-body-sm text-text-secondary"
                    >
                      {t.key}
                      <span className="font-label-mono-sm text-label-mono-sm tabular-nums text-primary">{t.count}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-auto pt-space-8 font-body-sm text-body-sm text-text-muted">
                  Angka di tiap label adalah berapa artikel yang memakainya. Label berasal dari sumber berita, bukan dari
                  penilaian Stocket.
                </p>
              </div>
            ) : (
              <p className="mt-space-8 font-body-sm text-body-sm text-text-muted">
                Artikel-artikel ini tidak membawa label topik dari sumbernya.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-space-12 rounded border border-state-negative/40 bg-state-negative/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-negative">
          {error}
        </p>
      )}

      {!articles && !error && (
        <div className="mt-space-12 grid grid-cols-1 gap-space-8 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded border border-border-subtle/60 bg-surface-container-lowest" />
          ))}
        </div>
      )}

      {articles && articles.length === 0 && (
        <p className="mt-space-12 font-body-sm text-body-sm text-text-muted">Belum ada berita yang menyebut emiten ini.</p>
      )}

      {articles && articles.length > 0 && (
        <div className="mt-space-12 grid grid-cols-1 gap-space-8 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((a, i) => (
            <Card key={`${a.source}-${i}`} article={a} tone={TAG_TONES[i % TAG_TONES.length]} />
          ))}
        </div>
      )}

      <p className="mt-space-8 flex items-center gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
        Berita ditampilkan apa adanya dari sumbernya. Kemunculan sebuah artikel di sini bukan penilaian kami atas emiten ini.
      </p>
    </div>
  );
}
