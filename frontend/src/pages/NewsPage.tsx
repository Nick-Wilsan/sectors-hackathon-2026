import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarketNews } from '../api/client';
import type { NewsArticleFull } from '../api/types';
import { NewsFeed } from '../components/NewsFeed';

const PAGE_SIZE = 20;

export function NewsPage() {
  const [articles, setArticles] = useState<NewsArticleFull[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMarketNews(PAGE_SIZE, page * PAGE_SIZE)
      .then((r) => setArticles(r.articles))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat berita'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        &larr; Kembali ke dashboard
      </Link>
      <h1 className="mt-3 text-xl font-semibold text-neutral-100">Berita Pasar</h1>
      <p className="mt-1 text-sm text-neutral-400">Berita emiten dan pasar modal Indonesia terbaru dari Sectors.</p>

      {loading && <p className="mt-6 text-sm text-neutral-400">Memuat berita...</p>}
      {error && <p className="mt-6 text-sm text-rose-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 px-3">
            <NewsFeed articles={articles} />
          </div>

          <div className="mt-4 flex justify-between text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-300 disabled:opacity-40"
            >
              &larr; Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={articles.length < PAGE_SIZE}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-300 disabled:opacity-40"
            >
              Berikutnya &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
}
