import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getAnomaly,
  getCandlestickPatterns,
  getCompositeScore,
  getDailyPrices,
  getFramework,
  getFundamentalExtras,
  getIndicators,
  getPeerComparison,
} from '../api/client';
import type {
  AnomalyResult,
  CandlestickResult,
  CompositeScoreResult,
  DailyBar,
  FrameworkResult,
  FundamentalExtras,
  IndicatorResult,
  PeerComparisonResult,
} from '../api/types';
import { ScoreBar } from '../components/ScoreBar';
import { PriceChart, type ChartType, type DrawingTool, type ReadoutBar } from '../components/PriceChart';
import { PatternSimilarityPanel } from '../components/PatternSimilarityPanel';
import { ChartToolbar, type RangeDays } from '../components/ChartToolbar';
import { ChartReadout } from '../components/ChartReadout';
import { DrawingToolbar } from '../components/DrawingToolbar';
import { FloatingAIChat } from '../components/FloatingAIChat';
import { EmitenIdentityCard } from '../components/EmitenIdentityCard';
import { SectorContextPanel } from '../components/SectorContextPanel';
import { ValuationHistoryTable } from '../components/ValuationHistoryTable';
import { EmitenNewsPanel } from '../components/EmitenNewsPanel';
import { FScorePanel } from '../components/FScorePanel';
import { PriceStatsPanel } from '../components/PriceStatsPanel';
import { PeerDataWarning } from '../components/PeerDataWarning';
import { AnomalyPanel } from '../components/AnomalyPanel';

const RANGE_LABEL: Record<number, string> = { 5: '5 hari', 30: '1 bulan', 90: '3 bulan' };

const STATUS_LABEL: Record<CompositeScoreResult['status'], string> = {
  ok: 'Lengkap',
  partial: 'Sebagian data (1 komponen hilang)',
  inadequate: 'Data tidak memadai',
};

function Panel({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex items-center justify-between gap-space-8 border-b border-border-subtle pb-space-8">
        <div className="flex items-center gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">{icon}</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-space-12">{children}</div>
    </div>
  );
}

export function EmitenDetailPage() {
  const { symbol = '' } = useParams();
  const [score, setScore] = useState<CompositeScoreResult | null>(null);
  const [peer, setPeer] = useState<PeerComparisonResult | null>(null);
  const [framework, setFramework] = useState<FrameworkResult | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyResult | null>(null);
  const [bars, setBars] = useState<DailyBar[]>([]);
  const [patterns, setPatterns] = useState<CandlestickResult | null>(null);
  const [indicators, setIndicators] = useState<IndicatorResult | null>(null);
  const [extras, setExtras] = useState<FundamentalExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<RangeDays>(90);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const [clearSignal, setClearSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [readout, setReadout] = useState<ReadoutBar | null>(null);
  // Indicators are OFF by default — user turns them on (Technical Spec decision).
  const [showMA, setShowMA] = useState(false);
  const [showRsi, setShowRsi] = useState(false);
  // Pattern markers start OFF so the chart opens clean; the pattern list in
  // the side panel is always there for anyone who wants the detail.
  const [showPatterns, setShowPatterns] = useState(false);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  // Native fullscreen is preferred (it hides browser chrome too), but it is
  // blocked in some embedding contexts and rejects silently. Falling back to an
  // in-page overlay guarantees the control always does something.
  const [expandedInPage, setExpandedInPage] = useState(false);

  async function toggleFullscreen() {
    if (!chartWrapperRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (expandedInPage) {
      setExpandedInPage(false);
      return;
    }
    try {
      await chartWrapperRef.current.requestFullscreen();
    } catch {
      setExpandedInPage(true);
      return;
    }
    // Some embedders resolve the promise without ever entering fullscreen, so
    // the result is checked rather than trusted. Without this the control looks
    // dead: no error, no fullscreen, no fallback.
    await new Promise((r) => setTimeout(r, 120));
    if (!document.fullscreenElement) setExpandedInPage(true);
  }

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Escape leaves the in-page overlay, matching native fullscreen behaviour.
  useEffect(() => {
    if (!expandedInPage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedInPage(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedInPage]);

  // Everything charted (bars, patterns, MA, RSI) is date-keyed (YYYY-MM-DD,
  // lexicographically sortable) — slicing all of them to the same cutoff
  // keeps the visible window consistent without any new API calls.
  const cutoffDate = useMemo(() => {
    const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[Math.max(0, sorted.length - rangeDays)]?.date;
  }, [bars, rangeDays]);

  const visibleBars = useMemo(() => (cutoffDate ? bars.filter((b) => b.date >= cutoffDate) : bars), [bars, cutoffDate]);
  const visiblePatterns = useMemo(
    () => (cutoffDate ? (patterns?.matches ?? []).filter((m) => m.date >= cutoffDate) : (patterns?.matches ?? [])),
    [patterns, cutoffDate],
  );
  const chartPatterns = showPatterns ? visiblePatterns : [];
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
      getFundamentalExtras(symbol),
    ])
      .then(([s, p, f, a, prices, pat, ind, ex]) => {
        setScore(s);
        setPeer(p);
        setFramework(f);
        setAnomaly(a);
        setBars(prices.bars);
        setPatterns(pat);
        setIndicators(ind);
        setExtras(ex);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data emiten'))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-space-8 px-space-16 py-space-16" aria-busy="true">
        <div className="h-40 animate-pulse rounded border border-border-subtle bg-surface-card" />
        <div className="h-[420px] animate-pulse rounded border border-border-subtle bg-surface-card" />
        <div className="h-52 animate-pulse rounded border border-border-subtle bg-surface-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-16">
        <div className="rounded border border-state-negative/40 bg-state-negative/10 px-space-16 py-space-12">
          <p className="font-body-md text-body-md text-state-negative">{error}</p>
          <Link to="/" className="mt-space-8 inline-block font-body-sm text-body-sm font-semibold text-primary hover:text-accent-hover">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!score) return null;

  const scoredComponents = score.components;
  const expanded = isFullscreen || expandedInPage;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-space-8 px-space-16 py-space-16">
      <EmitenIdentityCard symbol={symbol} peer={peer} score={score} extras={extras} bars={bars} />

      {peer && <PeerDataWarning failures={peer.fetchFailures} groupSize={peer.groupSize} />}

      {score.status === 'inadequate' && (
        <p className="rounded border border-state-warning/40 bg-state-warning/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-warning">
          Emiten ini kehilangan lebih dari satu komponen data yang dibutuhkan untuk Skor Komposit, sehingga sengaja tidak diberi skor agar tidak
          menyesatkan.
        </p>
      )}

      {/* Chart (left) beside the analysis rail (right). The mockup's rail held a
          buy/sell consensus meter and an order book: the first is a
          recommendation the PRD forbids, the second needs an order-flow feed
          Sectors does not provide. The score breakdown and the pattern list
          take that space instead — same layout, real content. */}
      <div className="grid grid-cols-1 items-start gap-space-8 xl:grid-cols-12">
        <div className="flex flex-col gap-space-8 xl:col-span-8">
        <div
          ref={chartWrapperRef}
          className={
            expandedInPage
              ? 'fixed inset-0 z-50 flex flex-col overflow-hidden border border-border-subtle bg-surface-card'
              : 'flex flex-col overflow-hidden rounded border border-border-subtle bg-surface-card'
          }
        >
          <ChartToolbar
            rangeDays={rangeDays}
            onRangeChange={setRangeDays}
            chartType={chartType}
            onChartTypeChange={setChartType}
            showMA={showMA}
            showRsi={showRsi}
            showPatterns={showPatterns}
            onToggleMA={() => setShowMA((v) => !v)}
            onToggleRsi={() => setShowRsi((v) => !v)}
            onTogglePatterns={() => setShowPatterns((v) => !v)}
            onReset={() => setResetSignal((n) => n + 1)}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={expanded}
          />
          <ChartReadout symbol={symbol} bar={readout} />
          <div className={`flex bg-background-base ${expanded ? 'min-h-0 flex-1' : 'h-[480px]'}`}>
            <DrawingToolbar tool={drawingTool} onToolChange={setDrawingTool} onClearAll={() => setClearSignal((n) => n + 1)} />
            <div className="min-w-0 flex-1">
              <PriceChart
                bars={visibleBars}
                patterns={chartPatterns}
                movingAverages={visibleMovingAverages}
                rsi={visibleRsi}
                drawingTool={drawingTool}
                onDrawComplete={() => setDrawingTool('none')}
                clearSignal={clearSignal}
                chartType={chartType}
                resetSignal={resetSignal}
                onReadoutChange={setReadout}
              />
            </div>
          </div>
          <p className="border-t border-border-subtle p-space-12 font-label-mono-sm text-label-mono-sm text-text-muted">
            Rentang maksimal 3 bulan &mdash; Sectors API membatasi riwayat harga harian di sekitar 90 hari, sehingga 6 bulan ke atas tidak
            tersedia. Aktifkan &quot;Pola&quot; untuk menandai pola candlestick di grafik.
          </p>
        </div>

        <PriceStatsPanel bars={visibleBars} rangeLabel={RANGE_LABEL[rangeDays]} />

        {anomaly && anomaly.status === 'ok' && <AnomalyPanel anomaly={anomaly} />}
        </div>

        <div className="flex flex-col gap-space-8 xl:col-span-4">
          <Panel
            title="Komponen Skor"
            icon="analytics"
            action={
              <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{STATUS_LABEL[score.status]}</span>
            }
          >
            {scoredComponents.length > 0 ? (
              <>
                <p className="mb-space-8 font-body-sm text-body-sm text-text-muted">
                  Persentil terhadap {scoredComponents[0].groupSize} emiten sub-sektor yang sama.
                </p>
                {!scoredComponents[0].groupSizeAdequate && (
                  <p className="mb-space-8 rounded border border-state-warning/40 bg-state-warning/10 px-space-8 py-space-6 font-body-sm text-body-sm text-state-warning">
                    Kelompok pembanding hanya {scoredComponents[0].groupSize} emiten &mdash; terlalu sedikit untuk persentil yang bermakna.
                  </p>
                )}
                <div className="flex flex-col gap-space-8">
                  {scoredComponents.map((c) => (
                    <ScoreBar key={c.key} label={c.label} value={c.percentile} />
                  ))}
                </div>
              </>
            ) : (
              <p className="font-body-sm text-body-sm text-text-muted">Komponen skor tidak tersedia untuk emiten ini.</p>
            )}
          </Panel>

          {framework && <FScorePanel framework={framework} />}

          {visiblePatterns.length > 0 && (
            <Panel
              title="Pola Candlestick"
              icon="candlestick_chart"
              action={<span className="font-label-mono-sm text-label-mono-sm text-text-muted">{visiblePatterns.length} pola</span>}
            >
              <div className="flex flex-col gap-space-4">
                {[...visiblePatterns]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 8)
                  .map((m, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-space-8 font-label-mono-sm text-label-mono-sm">
                      <span className="text-text-muted">{m.date}</span>
                      <span className="font-semibold text-text-secondary">{m.label}</span>
                    </div>
                  ))}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {peer && <SectorContextPanel symbol={symbol} peer={peer} score={score} extras={extras} />}

      {extras && extras.historicalValuation.length > 0 && (
        <ValuationHistoryTable symbol={symbol} rows={extras.historicalValuation} />
      )}

      {(showMA || showRsi) && indicators?.status === 'ok' && (
        <Panel title="Penjelasan Indikator" icon="show_chart">
          <div className="flex flex-col gap-space-6 font-body-sm text-body-sm text-text-secondary">
            {showMA && <p>{indicators.explanation.movingAverage}</p>}
            {showRsi && <p>{indicators.explanation.rsi}</p>}
          </div>
        </Panel>
      )}

      <EmitenNewsPanel key={symbol} symbol={symbol} />

      <PatternSimilarityPanel symbol={symbol} variant="card" />

      <FloatingAIChat symbol={symbol} />
    </div>
  );
}
