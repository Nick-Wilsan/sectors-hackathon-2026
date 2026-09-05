import { useEffect, useState } from 'react';
import { getEmitenNews } from '../api/client';
import type { NewsArticleFull } from '../api/types';

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

export function EmitenNewsPanel({ symbol }: { symbol: string }) {
  const [articles, setArticles] = useState<NewsArticleFull[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No synchronous reset here: the parent remounts this panel with key={symbol},
  // so state starts fresh per emiten and the effect only ever writes async.
  useEffect(() => {
    getEmitenNews(symbol, 6)
      .then((r) => setArticles(r.articles))
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
