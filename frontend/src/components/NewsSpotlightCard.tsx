import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticleFull } from '../api/types';
import { NEWS_CATEGORIES, categorizeNews, estimateReadingMinutes, titleCase, type NewsCategory } from '../lib/newsCategory';

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function ImageCard({ article }: { article: NewsArticleFull }) {
  const minutes = estimateReadingMinutes(article);
  return (
    <a
      href={article.source}
      target="_blank"
      rel="noreferrer"
      className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded border border-border-subtle/60 bg-surface-container-lowest transition-colors hover:border-surface-variant"
    >
      <div className="relative h-24 w-full overflow-hidden bg-surface-container">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-text-muted">📰</div>
        )}
        {article.subSector?.[0] && (
          <span className="absolute left-1 top-1 max-w-[85%] truncate rounded border border-border-subtle/50 bg-background-base/90 px-space-4 py-space-2 font-label-mono-sm text-[10px] text-primary">
            {titleCase(article.subSector[0])}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-space-8">
        <h3 className="line-clamp-2 font-headline-sm text-[13px] font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <div className="mt-space-6 flex items-center justify-between border-t border-border-subtle/40 pt-space-6 font-label-mono-sm text-[10px] text-text-muted">
          <span>{timeAgo(article.timestamp)}</span>
          {minutes !== null && <span>{minutes} mnt baca</span>}
        </div>
      </div>
    </a>
  );
}

function TextCard({ article, category }: { article: NewsArticleFull; category: Exclude<NewsCategory, 'Semua'> }) {
  return (
    <a
      href={article.source}
      target="_blank"
      rel="noreferrer"
      className="group flex cursor-pointer flex-col justify-between rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8 transition-colors hover:border-surface-variant"
    >
      <div>
        <div className="mb-space-4 flex items-center justify-between">
          <span className="rounded border border-border-subtle bg-surface-container px-space-4 py-space-2 font-label-mono-sm text-[10px] text-state-warning">
            {category}
          </span>
          <span className="font-label-mono-sm text-[10px] text-text-muted">{timeAgo(article.timestamp)}</span>
        </div>
        <h3 className="line-clamp-2 font-headline-sm text-[13px] font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          {article.title}
        </h3>
      </div>
      <div className="mt-space-6 flex items-center justify-between border-t border-border-subtle/40 pt-space-6 font-label-mono-sm text-[10px] text-text-muted">
        <span className="truncate">{article.subSector?.[0] ? titleCase(article.subSector[0]) : (article.sector ?? '—')}</span>
      </div>
    </a>
  );
}

export function NewsSpotlightCard({ articles }: { articles: NewsArticleFull[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Semua');

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (category !== 'Semua' && categorizeNews(a) !== category) return false;
      if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [articles, category, query]);

  const shown = filtered.slice(0, 4);

  return (
    <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16">
      <div>
        <div className="mb-space-8 flex items-center justify-between border-b border-border-subtle pb-space-8">
          <div className="flex items-center gap-space-6">
            <span className="material-symbols-outlined text-[18px] text-primary">newspaper</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Kabar &amp; Riset Emiten Terkini</h2>
          </div>
          <Link
            to="/berita"
            className="flex items-center gap-space-2 font-body-sm text-body-sm font-semibold text-primary transition-colors hover:text-accent-hover"
          >
            Lihat Semua <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="mb-space-12 flex flex-col gap-space-6">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-space-8 text-[16px] text-text-muted">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berita emiten (mis. BBCA, Dividen, IPO)..."
              className="h-[32px] w-full rounded border border-border-subtle bg-surface-container-lowest pl-[30px] pr-space-8 font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:border-primary-container focus:outline-none"
            />
          </div>
          <div className="flex select-none items-center gap-space-4 overflow-x-auto font-label-mono-sm text-label-mono-sm">
            {NEWS_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded border px-space-6 py-space-2 transition-colors ${
                  category === c
                    ? 'border-border-subtle bg-surface-container font-semibold text-primary-container'
                    : 'border-border-subtle/50 bg-surface-container-lowest text-text-muted hover:text-text-primary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="py-6 text-center font-body-sm text-body-sm text-text-muted">Tidak ada berita yang cocok.</p>
        ) : (
          <div className="grid grid-cols-1 gap-space-8 sm:grid-cols-2">
            {shown.map((a, i) =>
              i < 2 ? <ImageCard key={i} article={a} /> : <TextCard key={i} article={a} category={categorizeNews(a)} />,
            )}
          </div>
        )}
      </div>

      <div className="mt-space-8 flex items-center justify-between border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="flex items-center gap-space-4">
          <span className="h-1.5 w-1.5 rounded-full bg-state-positive" />
          Disaring otomatis oleh Stocket dari data Sectors
        </span>
        <span className="font-label-mono-sm text-label-mono-sm text-text-secondary">Pembaruan: Tiap 10 Menit</span>
      </div>
    </div>
  );
}
