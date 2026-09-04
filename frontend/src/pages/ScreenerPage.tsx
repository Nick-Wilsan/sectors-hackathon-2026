import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubsectors, screenCompanies } from '../api/client';
import type { ScreenerResult, SubsectorOption } from '../api/types';
import { ScoreBar } from '../components/ScoreBar';

export function ScreenerPage() {
  const [subsectors, setSubsectors] = useState<SubsectorOption[]>([]);
  const [subSector, setSubSector] = useState('');
  const [minScore, setMinScore] = useState('');
  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubsectors()
      .then((list) => {
        setSubsectors(list);
        if (list.length > 0) setSubSector(list[0].subsector);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat daftar sub-sektor'));
  }, []);

  useEffect(() => {
    if (!subSector) return;
    setLoading(true);
    setError(null);
    screenCompanies({ subSector, sortBy: 'score', sortDirection: 'desc', minScore: minScore ? Number(minScore) : undefined })
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data screener'))
      .finally(() => setLoading(false));
  }, [subSector, minScore]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-100">Screener Emiten</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Saring dan urutkan emiten berdasarkan Skor Komposit Fundamental dalam satu sub-sektor.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">Sub-sektor</span>
          <select
            value={subSector}
            onChange={(e) => setSubSector(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          >
            {subsectors.map((s) => (
              <option key={s.subsector} value={s.subsector}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">Skor minimum</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="0"
            className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          />
        </label>
      </div>

      {loading && <p className="mt-6 text-sm text-neutral-400">Memuat data dari Sectors...</p>}
      {error && <p className="mt-6 text-sm text-rose-400">{error}</p>}

      {result && !loading && (
        <>
          <p className="mt-6 text-xs text-neutral-500">
            Kelompok pembanding: {result.groupSize} emiten sub-sektor "{subSector}". Menampilkan {result.ranked.length}{' '}
            emiten dengan skor{result.dataTidakMemadai.length > 0 && `, ${result.dataTidakMemadai.length} data tidak memadai disembunyikan`}.
          </p>

          <div className="mt-3 divide-y divide-neutral-800 overflow-hidden rounded-lg border border-neutral-800">
            {result.ranked.map((c, i) => (
              <Link
                key={c.symbol}
                to={`/emiten/${c.symbol.replace('.JK', '')}`}
                className="flex items-center gap-4 bg-neutral-900 px-4 py-3 hover:bg-neutral-800"
              >
                <span className="w-6 text-sm text-neutral-500">{i + 1}</span>
                <div className="w-56 shrink-0">
                  <div className="text-sm font-medium text-neutral-100">{c.symbol.replace('.JK', '')}</div>
                  <div className="truncate text-xs text-neutral-500">{c.companyName}</div>
                </div>
                <div className="flex-1">
                  <ScoreBar value={c.score ?? 0} />
                </div>
              </Link>
            ))}
            {result.ranked.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-neutral-500">Tidak ada emiten yang cocok dengan filter.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
