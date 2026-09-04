import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAnomaly, getCandlestickPatterns, getCompositeScore, getDailyPrices, getFramework, getIndicators, getPeerComparison } from '../api/client';
import type { AnomalyResult, CandlestickResult, CompositeScoreResult, DailyBar, FrameworkResult, IndicatorResult, PeerComparisonResult } from '../api/types';
import { ScoreBar } from '../components/ScoreBar';
import { PriceChart, type DrawingTool } from '../components/PriceChart';
import { PatternSimilarityPanel } from '../components/PatternSimilarityPanel';
import { TickerHeader } from '../components/TickerHeader';
import { ChartToolbar } from '../components/ChartToolbar';
import { DrawingToolbar } from '../components/DrawingToolbar';
import { RightPanel } from '../components/RightPanel';
import { FloatingAIChat } from '../components/FloatingAIChat';
import { SymbolSearch } from '../components/SymbolSearch';
import { Wordmark } from '../components/Wordmark';

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

  const [rangeDays, setRangeDays] = useState<30 | 90>(90);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const [clearSignal, setClearSignal] = useState(0);
  // Indicators are OFF by default — user turns them on (Technical Spec decision).
  const [showMA, setShowMA] = useState(false);
  const [showRsi, setShowRsi] = useState(false);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  function toggleFullscreen() {
    if (!chartWrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      chartWrapperRef.current.requestFullscreen();
    }
  }

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Everything charted (bars, patterns, MA, RSI) is date-keyed (YYYY-MM-DD,
  // lexicographically sortable) — slicing all of them to the same cutoff
  // keeps the visible window consistent without any new API calls.
  const cutoffDate = useMemo(() => {
    const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
    const cutoffIndex = Math.max(0, sorted.length - rangeDays);
    return sorted[cutoffIndex]?.date;
  }, [bars, rangeDays]);

  const visibleBars = useMemo(() => (cutoffDate ? bars.filter((b) => b.date >= cutoffDate) : bars), [bars, cutoffDate]);
  const visiblePatterns = useMemo(
    () => (cutoffDate ? (patterns?.matches ?? []).filter((m) => m.date >= cutoffDate) : (patterns?.matches ?? [])),
    [patterns, cutoffDate],
  );
  const visibleMovingAverages = useMemo(() => {
    if (!showMA) return [];
    return (indicators?.movingAverages ?? []).map((ma) => ({
      ...ma,
      points: cutoffDate ? ma.points.filter((p) => p.date >= cutoffDate) : ma.points,
    }));
  }, [indicators, cutoffDate, showMA]);
  const visibleRsi = useMemo(() => {
    if (!showRsi || !indicators?.rsi) return null;
    return { ...indicators.rsi, points: cutoffDate ? indicators.rsi.points.filter((p) => p.date >= cutoffDate) : indicators.rsi.points };
  }, [indicators, cutoffDate, showRsi]);

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
    <div className="fixed inset-0 z-30 flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-800 px-3 py-1.5">
        <div className="flex items-center gap-3">
          <Link to="/" title="Kembali ke dashboard">
            <Wordmark />
          </Link>
        </div>
        <SymbolSearch />
      </header>

      <div ref={chartWrapperRef} className="flex flex-1 overflow-hidden">
        <DrawingToolbar
          tool={drawingTool}
          onToolChange={setDrawingTool}
          onClearAll={() => setClearSignal((n) => n + 1)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TickerHeader symbol={symbol} companyName={peer?.companyName ?? ''} bars={bars} />
          <ChartToolbar
            rangeDays={rangeDays}
            onRangeChange={setRangeDays}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            showMA={showMA}
            showRsi={showRsi}
            onToggleMA={() => setShowMA((v) => !v)}
            onToggleRsi={() => setShowRsi((v) => !v)}
          />
          <div className="min-h-0 flex-1 p-1">
            <PriceChart
              bars={visibleBars}
              patterns={visiblePatterns}
              movingAverages={visibleMovingAverages}
              rsi={visibleRsi}
              drawingTool={drawingTool}
              onDrawComplete={() => setDrawingTool('none')}
              clearSignal={clearSignal}
            />
          </div>
        </div>

        <RightPanel open={rightPanelOpen} onToggle={() => setRightPanelOpen((v) => !v)}>
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">{symbol.toUpperCase()}</h1>
              <p className="text-xs text-neutral-400">{peer?.companyName ?? '—'}</p>
              {peer?.subSector && <p className="text-[11px] text-neutral-500">Sub-sektor: {peer.subSector}</p>}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-100">{score.score ?? '—'}</div>
              <div className="text-[10px] text-neutral-500">Skor ({STATUS_LABEL[score.status]})</div>
            </div>
          </div>

          {score.status === 'inadequate' && (
            <p className="mt-3 rounded-md border border-amber-900 bg-amber-950/50 px-3 py-2 text-xs text-amber-300">
              Emiten ini kehilangan lebih dari satu komponen data yang dibutuhkan untuk Skor Komposit, sehingga tidak
              diberi skor agar tidak menyesatkan.
            </p>
          )}

          {(showMA || showRsi) && indicators && indicators.status === 'ok' && (
            <div className="mt-3 space-y-1.5 border-t border-neutral-800 pt-3 text-[11px] text-neutral-500">
              {showMA && <p>{indicators.explanation.movingAverage}</p>}
              {showRsi && <p>{indicators.explanation.rsi}</p>}
            </div>
          )}

          {visiblePatterns.length > 0 && (
            <div className="mt-3 border-t border-neutral-800 pt-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Pola Candlestick</h2>
              <p className="mt-1 text-[11px] text-neutral-500">{patterns?.reliabilityWarning}</p>
              <div className="mt-2 space-y-1.5">
                {[...visiblePatterns]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 8)
                  .map((m, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-neutral-500">{m.date}</span>{' '}
                      <span className="font-medium text-neutral-300">{m.label}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {score.components.length > 0 && (
            <div className="mt-3 border-t border-neutral-800 pt-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Komponen Skor</h2>
              <p className="mt-1 text-[11px] text-neutral-500">
                Persentil terhadap {score.components[0].groupSize} emiten sub-sektor yang sama.
              </p>
              {!score.components[0].groupSizeAdequate && (
                <p className="mt-2 rounded-md border border-amber-900 bg-amber-950/40 px-2.5 py-1.5 text-[11px] text-amber-200">
                  Kelompok pembanding hanya berisi {score.components[0].groupSize} emiten — terlalu sedikit untuk
                  persentil yang bermakna.
                </p>
              )}
              <div className="mt-2 space-y-2">
                {score.components.map((c) => (
                  <ScoreBar key={c.key} label={c.label} value={c.percentile} />
                ))}
              </div>
            </div>
          )}

          {framework && (
            <div className="mt-3 border-t border-neutral-800 pt-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">{framework.frameworkName}</h2>
              <p className="mt-1 text-[11px] text-neutral-500">{framework.frameworkDescription}</p>
              {framework.status === 'inadequate' ? (
                <p className="mt-2 text-xs text-neutral-500">Data tidak memadai untuk klasifikasi.</p>
              ) : (
                <>
                  <p className="mt-2 text-xs font-medium text-neutral-200">{framework.classification}</p>
                  <div className="mt-2 space-y-1.5">
                    {framework.criteria.map((c) => (
                      <div key={c.key} className="text-xs">
                        <span className={c.met === null ? 'text-neutral-600' : c.met ? 'text-emerald-400' : 'text-rose-400'}>
                          {c.met === null ? '–' : c.met ? '✓' : '✗'}
                        </span>{' '}
                        <span className="text-neutral-300">{c.label}</span>
                        <div className="ml-4 text-[11px] text-neutral-500">{c.detail}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {anomaly && anomaly.status === 'ok' && (
            <div className="mt-3 border-t border-neutral-800 pt-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Deteksi Anomali</h2>
              {!anomaly.hasAnomaly ? (
                <p className="mt-2 text-xs text-neutral-500">Tidak ada penyimpangan signifikan terdeteksi.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {anomaly.metrics.map((m) => (
                    <div
                      key={m.key}
                      className={`rounded-md border px-2.5 py-1.5 text-xs ${
                        m.isAnomaly ? 'border-amber-900 bg-amber-950/40 text-amber-200' : 'border-neutral-800 text-neutral-500'
                      }`}
                    >
                      {m.label}: {m.zScore.toFixed(2)} std.dev {m.isAnomaly && '— anomali'}
                    </div>
                  ))}
                  {anomaly.relatedNews.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[11px] text-neutral-500">{anomaly.newsDisclaimer}</p>
                      {anomaly.relatedNews.map((n, i) => (
                        <a key={i} href={n.source} target="_blank" rel="noreferrer" className="block text-xs text-neutral-400 hover:text-neutral-200">
                          {n.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {peer && peer.peers.length > 0 && (
            <div className="mt-3 border-t border-neutral-800 pt-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Perbandingan Peer ({peer.groupSize})
              </h2>
              <div className="mt-2 max-h-64 overflow-y-auto">
                {[...peer.peers]
                  .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                  .map((p) => {
                    const isSelf = p.symbol === peer.symbol;
                    return (
                      <Link
                        key={p.symbol}
                        to={`/emiten/${p.symbol.replace('.JK', '')}`}
                        className={`flex items-center justify-between px-1.5 py-1 text-xs hover:bg-neutral-800 ${
                          isSelf ? 'bg-neutral-800/70 font-medium text-neutral-100' : 'text-neutral-400'
                        }`}
                      >
                        <span className="truncate">{p.symbol.replace('.JK', '')}</span>
                        <span>{p.score ?? '—'}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="mt-3 border-t border-neutral-800 pt-3">
            <PatternSimilarityPanel symbol={symbol} />
          </div>
        </RightPanel>
      </div>

      <div className="shrink-0 border-t border-neutral-800 px-3 py-1 text-center text-[10px] text-neutral-600">
        Alat informasi dan analisis, <strong>bukan rekomendasi investasi</strong>. Data pasar bersumber dari Sectors.
      </div>

      <FloatingAIChat symbol={symbol} />
    </div>
  );
}
