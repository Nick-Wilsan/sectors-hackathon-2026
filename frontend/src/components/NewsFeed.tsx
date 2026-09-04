import type { NewsArticleFull } from '../api/types';

interface NewsFeedProps {
  articles: NewsArticleFull[];
  compact?: boolean;
}

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function NewsFeed({ articles, compact = false }: NewsFeedProps) {
  return (
    <div className="divide-y divide-neutral-800/70">
      {articles.map((a, i) => (
        <a
          key={i}
          href={a.source}
          target="_blank"
          rel="noreferrer"
          className="flex gap-3 py-2.5 hover:bg-neutral-800/40"
        >
          {a.thumbnail && !compact && (
            <img src={a.thumbnail} alt="" className="h-14 w-20 shrink-0 rounded object-cover" loading="lazy" />
          )}
          <div className="min-w-0 flex-1">
            <p className={`line-clamp-2 font-medium text-neutral-200 ${compact ? 'text-xs' : 'text-sm'}`}>{a.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
              <span>{timeAgo(a.timestamp)}</span>
              {a.subSector && a.subSector[0] && (
                <>
                  <span>&middot;</span>
                  <span className="capitalize">{a.subSector[0].replace(/-/g, ' ')}</span>
                </>
              )}
            </div>
          </div>
        </a>
      ))}
      {articles.length === 0 && <p className="py-6 text-center text-sm text-neutral-500">Belum ada berita.</p>}
    </div>
  );
}
