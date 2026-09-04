import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAnomaly, getCandlestickPatterns, getCompositeScore, getDailyPrices, getFramework, getIndicators, getPeerComparison } from '../api/client';
import type { AnomalyResult, CandlestickResult, CompositeScoreResult, DailyBar, FrameworkResult, IndicatorResult, PeerComparisonResult } from '../api/types';
import { ScoreBar } from '../components/ScoreBar';
import { AskPanel } from '../components/AskPanel';
import { PriceChart } from '../components/PriceChart';

const STATUS_LABEL: Record<CompositeScoreResult['status'], string> = {
  ok: 'Lengkap',
  partial: 'Sebagian data (1 komponen hilang)',
  inadequate: 'Data tidak memadai',
};

export function EmitenDetailPage() {
  const { symbol = '' } = useParams();
  const [score, setScore] = useState<CompositeScoreResult | null>(null);
  const [peer, setPeer] = useState<PeerComparisonResult | null>(null);
  const [framework, setFramework] = useState<FrameworkResult | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyResult | null>(null);
  const [bars, setBars] = useState<DailyBar[]>([]);
  const [patterns, setPatterns] = useState<CandlestickResult | null>(null);
  const [indicators, setIndicators] = useState<IndicatorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getCompositeScore(symbol),
      getPeerComparison(symbol),
      getFramework(symbol),
      getAnomaly(symbol),
      getDailyPrices(symbol),
      getCandlestickPatterns(symbol),
      getIndicators(symbol),
    ])
      .then(([scoreResult, peerResult, frameworkResult, anomalyResult, priceResult, patternResult, indicatorResult]) => {
        setScore(scoreResult);
        setPeer(peerResult);
        setFramework(frameworkResult);
        setAnomaly(anomalyResult);
        setBars(priceResult.bars);
        setPatterns(patternResult);
        setIndicators(indicatorResult);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data emiten'))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-neutral-400">Memuat data dari Sectors...</div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-rose-400">{error}</div>;
  if (!score) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Kembali ke screener
      </Link>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">{symbol.toUpperCase()}</h1>
          <p className="text-sm text-neutral-400">{peer?.companyName ?? '—'}</p>
          {peer?.subSector && <p className="text-xs text-neutral-500">Sub-sektor: {peer.subSector}</p>}
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-neutral-100">{score.score ?? '—'}</div>
          <div className="text-xs text-neutral-500">Skor Komposit ({STATUS_LABEL[score.status]})</div>
        </div>
      </div>

      {score.status === 'inadequate' && (
        <p className="mt-4 rounded-md border border-amber-900 bg-amber-950/50 px-4 py-3 text-sm text-amber-300">
          Emiten ini kehilangan lebih dari satu komponen data yang dibutuhkan untuk Skor Komposit, sehingga tidak
          diberi skor agar tidak menyesatkan.
        </p>
      )}

      {bars.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-neutral-300">Grafik Harga</h2>
          <p className="mt-1 text-xs text-neutral-500">
            90 hari terakhir. {patterns && patterns.matches.length > 0 && `${patterns.matches.length} penanda pola candlestick ditemukan.`}
          </p>
          <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
            <PriceChart
              bars={bars}
              patterns={patterns?.matches}
              movingAverages={indicators?.movingAverages}
              rsi={indicators?.rsi}
            />
          </div>
          {indicators && indicators.status === 'ok' && (
            <div className="mt-3 space-y-1 text-xs text-neutral-500">
              <p>{indicators.explanation.movingAverage}</p>
              <p>{indicators.explanation.rsi}</p>
            </div>
          )}
          {patterns && patterns.matches.length > 0 && (
            <>
              <p className="mt-3 text-xs text-neutral-500">{patterns.reliabilityWarning}</p>
              <div className="mt-2 space-y-1.5">
                {[...patterns.matches]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 8)
                  .map((m, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-neutral-400">{m.date}</span>{' '}
                      <span className="font-medium text-neutral-200">{m.label}</span>
                      <span className="text-neutral-500"> — {m.definition}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      )}

      {score.components.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-neutral-300">Komponen Skor</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Persentil terhadap {score.components[0].groupSize} emiten sub-sektor yang sama. Angka lebih tinggi = lebih baik
            (untuk DER, persentil sudah dibalik).
          </p>
          <div className="mt-3 space-y-3">
            {score.components.map((c) => (
              <ScoreBar key={c.key} label={c.label} value={c.percentile} />
            ))}
          </div>
        </section>
      )}

      {framework && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-neutral-300">{framework.frameworkName}</h2>
          <p className="mt-1 text-xs text-neutral-500">{framework.frameworkDescription}</p>

          {framework.status === 'inadequate' ? (
            <p className="mt-3 rounded-md border border-amber-900 bg-amber-950/50 px-4 py-3 text-sm text-amber-300">
              Data tidak memadai untuk klasifikasi framework ini.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm font-medium text-neutral-200">{framework.classification}</p>
              <div className="mt-3 space-y-2">
                {framework.criteria.map((c) => (
                  <div key={c.key} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        c.met === null ? 'text-neutral-600' : c.met ? 'text-emerald-500' : 'text-neutral-500'
                      }`}
                    >
                      {c.met === null ? '—' : c.met ? '✓' : '✗'}
                    </span>
                    <div>
                      <div className="text-neutral-300">{c.label}</div>
                      <div className="text-xs text-neutral-500">{c.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {anomaly && anomaly.status === 'ok' && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-neutral-300">Deteksi Anomali</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Membandingkan volume dan perubahan harga tanggal {anomaly.date} terhadap sebaran historis emiten ini sendiri.
            Ambang batas: penyimpangan lebih dari {anomaly.threshold} standar deviasi. Ini pernyataan statistik semata,
            bukan penyebab maupun perkiraan kelanjutan pergerakan harga.
          </p>

          {!anomaly.hasAnomaly ? (
            <p className="mt-3 text-sm text-neutral-400">Tidak ada penyimpangan signifikan terdeteksi.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {anomaly.metrics.map((m) => (
                <div
                  key={m.key}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    m.isAnomaly ? 'border-amber-900 bg-amber-950/40 text-amber-200' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  {m.label}: nilai terkini {m.latestValue.toLocaleString('id-ID')}, rata-rata baseline{' '}
                  {m.baselineMean.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ({m.zScore.toFixed(2)} standar deviasi)
                  {m.isAnomaly && ' — anomali'}
                </div>
              ))}
            </div>
          )}

          {anomaly.relatedNews.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-neutral-500">{anomaly.newsDisclaimer}</p>
              <div className="mt-2 space-y-2">
                {anomaly.relatedNews.map((n, i) => (
                  <a
                    key={i}
                    href={n.source}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                  >
                    {n.title}
                    <span className="ml-2 text-xs text-neutral-500">{new Date(n.timestamp).toLocaleDateString('id-ID')}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {peer && peer.peers.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-neutral-300">
            Perbandingan Peer <span className="text-neutral-500">({peer.groupSize} emiten)</span>
          </h2>
          <div className="mt-3 divide-y divide-neutral-800 overflow-hidden rounded-lg border border-neutral-800">
            {[...peer.peers]
              .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
              .map((p) => {
                const isSelf = p.symbol === peer.symbol;
                return (
                  <Link
                    key={p.symbol}
                    to={`/emiten/${p.symbol.replace('.JK', '')}`}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-800 ${
                      isSelf ? 'bg-neutral-800' : 'bg-neutral-900'
                    }`}
                  >
                    <span className={isSelf ? 'font-semibold text-neutral-100' : 'text-neutral-300'}>
                      {p.symbol.replace('.JK', '')} — {p.companyName}
                    </span>
                    <span className="text-neutral-400">{p.score ?? '—'}</span>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      <AskPanel symbol={symbol} />
    </div>
  );
}
