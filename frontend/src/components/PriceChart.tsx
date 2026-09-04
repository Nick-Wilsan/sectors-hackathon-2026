import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts';
import type { DailyBar, MovingAverageSeries, PatternMatch, RsiSeries } from '../api/types';

export type DrawingTool = 'none' | 'horizontal' | 'trendline';

interface PriceChartProps {
  bars: DailyBar[];
  patterns?: PatternMatch[];
  movingAverages?: MovingAverageSeries[];
  rsi?: RsiSeries | null;
  /** Active drawing tool — real drawing (horizontal price lines, 2-click trend lines), not decorative. */
  drawingTool?: DrawingTool;
  /** Called once a shape is placed, so the parent can revert the toolbar to the cursor tool. */
  onDrawComplete?: () => void;
  /** Increment to clear all user-drawn lines. */
  clearSignal?: number;
}

const MA_COLORS = ['#f59e0b', '#38bdf8', '#a78bfa'];
const DRAWING_COLOR = '#0ea5e9';

const CATEGORY_STYLE = {
  'reversal-bullish': { color: '#10b981', shape: 'arrowUp' as const, position: 'belowBar' as const },
  'reversal-bearish': { color: '#f43f5e', shape: 'arrowDown' as const, position: 'aboveBar' as const },
  indecision: { color: '#a3a3a3', shape: 'circle' as const, position: 'inBar' as const },
};

// F-07 kriteria selesai: "penanda muncul pada posisi yang tepat di grafik."
// Multiple patterns can match the same date (e.g. a doji inside a morning
// star) — lightweight-charts takes one marker per time value, so matches
// sharing a date are merged into a single marker listing every label.
function toMarkers(patterns: PatternMatch[]): SeriesMarker<Time>[] {
  const byDate = new Map<string, PatternMatch[]>();
  for (const p of patterns) {
    const list = byDate.get(p.date) ?? [];
    list.push(p);
    byDate.set(p.date, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, matches]) => {
      const primary = matches[0];
      const style = CATEGORY_STYLE[primary.category];
      return {
        time: date as Time,
        position: style.position,
        color: style.color,
        shape: style.shape,
        text: matches.map((m) => m.label).join(', '),
      };
    });
}

export function PriceChart({
  bars,
  patterns = [],
  movingAverages = [],
  rsi = null,
  drawingTool = 'none',
  onDrawComplete,
  clearSignal = 0,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Refs mirroring props so the click handler (registered once) always reads
  // the latest values instead of closing over stale props.
  const drawingToolRef = useRef<DrawingTool>(drawingTool);
  const onDrawCompleteRef = useRef(onDrawComplete);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const trendLineSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const pendingTrendPointRef = useRef<{ time: Time; price: number } | null>(null);

  useEffect(() => {
    drawingToolRef.current = drawingTool;
    pendingTrendPointRef.current = null; // switching tools cancels an in-progress trend line
  }, [drawingTool]);

  useEffect(() => {
    onDrawCompleteRef.current = onDrawComplete;
  }, [onDrawComplete]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#a3a3a3' },
      grid: { vertLines: { color: '#262626' }, horzLines: { color: '#262626' } },
      height: containerRef.current.clientHeight || 480,
      width: containerRef.current.clientWidth,
      timeScale: { borderColor: '#262626' },
      rightPriceScale: { borderColor: '#262626' },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    seriesRef.current = series;

    // Volume overlays the bottom ~20% of the main price pane on its own price
    // scale (never sharing the price axis), same convention TradingView uses.
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;

    // Real drawing: click places a horizontal price line, or (2 clicks) a
    // trend line between the two points. Only active while a tool is selected.
    chart.subscribeClick((param) => {
      const tool = drawingToolRef.current;
      if (tool === 'none' || !param.point || !param.time || !seriesRef.current) return;

      const price = seriesRef.current.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (tool === 'horizontal') {
        const line = seriesRef.current.createPriceLine({
          price,
          color: DRAWING_COLOR,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: price.toFixed(0),
        });
        priceLinesRef.current.push(line);
        onDrawCompleteRef.current?.();
      } else if (tool === 'trendline') {
        const pending = pendingTrendPointRef.current;
        if (!pending) {
          pendingTrendPointRef.current = { time: param.time, price };
        } else {
          const lineSeries = chart.addSeries(LineSeries, { color: DRAWING_COLOR, lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
          lineSeries.setData(
            [
              { time: pending.time, value: pending.price },
              { time: param.time, value: price },
            ].sort((a, b) => (a.time as string).localeCompare(b.time as string)),
          );
          trendLineSeriesRef.current.push(lineSeries);
          pendingTrendPointRef.current = null;
          onDrawCompleteRef.current?.();
        }
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width) chart.applyOptions({ width, height: height || undefined });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      maSeriesRef.current = [];
      rsiSeriesRef.current = null;
      priceLinesRef.current = [];
      trendLineSeriesRef.current = [];
    };
    // Chart instance is created once; data/tool updates happen in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
    series.setData(
      sorted.map((b) => ({
        time: b.date as Time,
        open: b.open ?? b.close,
        high: b.high ?? b.close,
        low: b.low ?? b.close,
        close: b.close,
      })),
    );

    createSeriesMarkers(series, toMarkers(patterns));

    volumeSeriesRef.current?.setData(
      sorted.map((b, i) => {
        const prevClose = i > 0 ? sorted[i - 1].close : b.close;
        return { time: b.date as Time, value: b.volume, color: b.close >= prevClose ? '#10b98166' : '#f43f5e66' };
      }),
    );

    chartRef.current?.timeScale().fitContent();
  }, [bars, patterns]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Rebuild MA line series to match however many periods are enabled (0 by default).
    for (const s of maSeriesRef.current) chart.removeSeries(s);
    maSeriesRef.current = movingAverages.map((ma, i) =>
      chart.addSeries(LineSeries, { color: MA_COLORS[i % MA_COLORS.length], lineWidth: 2, title: ma.label }),
    );
    movingAverages.forEach((ma, i) => {
      maSeriesRef.current[i].setData(ma.points.map((p) => ({ time: p.date as Time, value: p.value })));
    });
  }, [movingAverages]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // RSI pane is created lazily (only when enabled) so it doesn't reserve
    // dead vertical space while indicators are off by default.
    if (rsi && rsi.points.length > 0) {
      if (!rsiSeriesRef.current) {
        rsiSeriesRef.current = chart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1 }, 1);
        chart.panes()[1]?.setHeight(120);
      }
      rsiSeriesRef.current.setData(rsi.points.map((p) => ({ time: p.date as Time, value: p.value })));
    } else if (rsiSeriesRef.current) {
      chart.removeSeries(rsiSeriesRef.current);
      rsiSeriesRef.current = null;
    }
  }, [rsi]);

  useEffect(() => {
    if (clearSignal === 0) return;
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    for (const line of priceLinesRef.current) series.removePriceLine(line);
    priceLinesRef.current = [];
    for (const s of trendLineSeriesRef.current) chart.removeSeries(s);
    trendLineSeriesRef.current = [];
    pendingTrendPointRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal]);

  return <div ref={containerRef} className={`h-full w-full ${drawingTool !== 'none' ? 'cursor-crosshair' : ''}`} />;
}
