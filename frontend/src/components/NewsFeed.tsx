import type { NewsArticleFull } from '../api/types';

interface NewsFeedProps {
  articles: NewsArticleFull[];
  compact?: boolean;
  /** Render as a multi-column card grid (image-on-top, like idx.co.id's news cards) instead of a thin vertical list. */
  grid?: boolean;
}

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function GridCard({ article }: { article: NewsArticleFull }) {
  return (
    <a
      href={article.source}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 hover:border-neutral-700"
    >
      {article.thumbnail ? (
        <img src={article.thumbnail} alt="" className="h-32 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-neutral-800 text-2xl text-neutral-600">📰</div>
      )}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-100">{article.title}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-neutral-500">
          <span>{timeAgo(article.timestamp)}</span>
          {article.subSector?.[0] && (
            <>
              <span>&middot;</span>
              <span className="capitalize text-brand-light">{article.subSector[0].replace(/-/g, ' ')}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

function ListRow({ article, compact }: { article: NewsArticleFull; compact: boolean }) {
  return (
    <a href={article.source} target="_blank" rel="noreferrer" className="flex gap-3 py-2.5 hover:bg-neutral-800/40">
      {article.thumbnail && (
        <img src={article.thumbnail} alt="" className={`shrink-0 rounded object-cover ${compact ? 'h-14 w-20' : 'h-20 w-28'}`} loading="lazy" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`line-clamp-2 font-semibold text-neutral-100 ${compact ? 'text-xs' : 'text-sm'}`}>{article.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
          <span>{timeAgo(article.timestamp)}</span>
          {article.subSector?.[0] && (
            <>
              <span>&middot;</span>
              <span className="capitalize">{article.subSector[0].replace(/-/g, ' ')}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

export function NewsFeed({ articles, compact = false, grid = false }: NewsFeedProps) {
  if (articles.length === 0) return <p className="py-6 text-center text-sm text-neutral-500">Belum ada berita.</p>;

  if (grid) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {articles.map((a, i) => (
          <GridCard key={i} article={a} />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-800/70">
      {articles.map((a, i) => (
        <ListRow key={i} article={a} compact={compact} />
      ))}
    </div>
  );
}
