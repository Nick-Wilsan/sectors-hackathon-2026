import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPatternSimilarity } from '../api/client';
import type { PatternSimilarityResult } from '../api/types';

interface PatternSimilarityPanelProps {
  symbol: string;
}

// F-09 is optional/P4 and each fresh call can cost real Sectors credits
// (one per not-yet-cached peer's price history) — loaded on demand only,
// never automatically on page view.
export function PatternSimilarityPanel({ symbol }: PatternSimilarityPanelProps) {
  const [result, setResult] = useState<PatternSimilarityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setResult(await getPatternSimilarity(symbol));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kemiripan pola');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-neutral-300">Kemiripan Pola Lintas Saham</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Fitur tambahan (opsional). Membandingkan bentuk pergerakan harga {'20 hari'} terakhir emiten ini dengan periode
        historis pada emiten lain di sub-sektor yang sama.
      </p>

      {!result && (
        <button
          onClick={load}
          disabled={loading}
          className="mt-3 rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500 disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Tampilkan Kemiripan Pola'}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {result && result.status === 'inadequate' && (
        <p className="mt-3 text-sm text-neutral-400">Data harga belum cukup untuk membandingkan pola.</p>
      )}

      {result && result.status === 'ok' && (
        <>
          <p className="mt-3 rounded-md border border-amber-900 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            {result.warning}
          </p>
          <div className="mt-3 space-y-2">
            {result.matches.map((m, i) => (
              <Link
                key={i}
                to={`/emiten/${m.symbol.replace('.JK', '')}`}
                className="block rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">
                    {m.symbol.replace('.JK', '')} — {m.companyName}
                  </span>
                  <span className="text-xs text-neutral-500">kemiripan {(m.similarity * 100).toFixed(0)}%</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Periode serupa: {m.matchStartDate} s/d {m.matchEndDate}.{' '}
                  {m.outcomeChangePercent === null
                    ? `Belum ada ${m.outcomeWindowDays} hari data setelah periode tersebut.`
                    : `${m.outcomeWindowDays} hari setelah periode itu, harga berubah ${(m.outcomeChangePercent * 100).toFixed(2)}%.`}
                </p>
              </Link>
            ))}
            {result.matches.length === 0 && <p className="text-sm text-neutral-500">Tidak ada emiten pembanding yang cukup datanya.</p>}
          </div>
        </>
      )}
    </section>
  );
}
