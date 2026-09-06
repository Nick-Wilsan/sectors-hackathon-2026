import { useEffect, useRef } from 'react';
import {
  createChart,
  AreaSeries,
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
import { tokenWarna, useTemaAktif } from '../lib/theme';

export type DrawingTool = 'none' | 'horizontal' | 'trendline';
export type ChartType = 'candles' | 'area';

/** One bar's values, emitted as the crosshair moves so the toolbar can show a live OHLC readout. */
export interface ReadoutBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  movingAverages: { label: string; value: number }[];
}

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
  /** Candlestick or filled area. Both render the same closes; area is calmer for a quick read. */
  chartType?: ChartType;
  /** Increment to re-fit the visible range after the user has zoomed or panned. */
  resetSignal?: number;
  /** Fires on crosshair move (and falls back to the last bar when the pointer leaves). */
  onReadoutChange?: (bar: ReadoutBar | null) => void;
}

// Warna dibaca dari token CSS agar mengikuti tema. lightweight-charts menerima
// warna sebagai nilai JavaScript, bukan kelas, sehingga tidak bisa ikut berubah
// sendiri seperti elemen SVG biasa.
const maColors = () => [tokenWarna('state-warning', '#f59e0b'), tokenWarna('accent-hover', '#38bdf8'), '#a78bfa'];
const drawingColor = () => tokenWarna('primary-container', '#0ea5e9');

const CATEGORY_STYLE = {
  'reversal-bullish': { color: 'state-positive', fallback: '#10b981', shape: 'arrowUp' as const, position: 'belowBar' as const },
  'reversal-bearish': { color: 'state-negative', fallback: '#f43f5e', shape: 'arrowDown' as const, position: 'aboveBar' as const },
  indecision: { color: 'text-muted', fallback: '#a3a3a3', shape: 'circle' as const, position: 'inBar' as const },
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
        color: tokenWarna(style.color, style.fallback),
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
  chartType = 'candles',
  resetSignal = 0,
  onReadoutChange,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | null>(null);
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
  const barsRef = useRef(bars);
  const maRef = useRef(movingAverages);
  const onReadoutRef = useRef(onReadoutChange);

  useEffect(() => {
    drawingToolRef.current = drawingTool;
    pendingTrendPointRef.current = null; // switching tools cancels an in-progress trend line
  }, [drawingTool]);

  useEffect(() => {
    onDrawCompleteRef.current = onDrawComplete;
  }, [onDrawComplete]);

  useEffect(() => {
    barsRef.current = bars;
    maRef.current = movingAverages;
    onReadoutRef.current = onReadoutChange;
  }, [bars, movingAverages, onReadoutChange]);

  /** Bar for a given date, packaged with whatever MA values exist on that date. */
  function readoutFor(date: string | null): ReadoutBar | null {
    const list = barsRef.current;
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const bar = date ? sorted.find((b) => b.date === date) : sorted[sorted.length - 1];
    if (!bar) return null;
    return {
      date: bar.date,
      open: bar.open ?? bar.close,
      high: bar.high ?? bar.close,
      low: bar.low ?? bar.close,
      close: bar.close,
      volume: bar.volume,
      movingAverages: maRef.current
        .map((ma) => ({ label: ma.label, value: ma.points.find((p) => p.date === bar.date)?.value }))
        .filter((m): m is { label: string; value: number } => m.value !== undefined),
    };
  }

  const tema = useTemaAktif();

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: tokenWarna('text-muted', '#a3a3a3') },
      grid: { vertLines: { color: tokenWarna('border-subtle', '#262626') }, horzLines: { color: tokenWarna('border-subtle', '#262626') } },
      height: containerRef.current.clientHeight || 480,
      width: containerRef.current.clientWidth,
      // rightOffset reserves a few empty bars after the last candle so the
      // MA/RSI last-value price labels have room to sit without visually
      // overlapping (and appearing to clip) the tail end of those lines.
      timeScale: { borderColor: tokenWarna('border-subtle', '#262626'), rightOffset: 4 },
      rightPriceScale: { borderColor: tokenWarna('border-subtle', '#262626') },
    });
    chartRef.current = chart;

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
          color: drawingColor(),
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
          const lineSeries = chart.addSeries(LineSeries, { color: drawingColor(), lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
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

    // lightweight-charts keeps bar spacing (px per candle) fixed across a
    // resize, so a chart first laid out narrow — which is what happens here,
    // because the container is measured before the flex/grid parents have
    // settled — keeps that spacing after it widens and leaves every candle
    // crammed into a thin band at the right edge. Re-fitting on each width
    // change is what actually keeps the series filling the plot area.
    let lastWidth = 0;
    chart.subscribeCrosshairMove((param) => {
      if (!onReadoutRef.current) return;
      const date = typeof param.time === 'string' ? param.time : null;
      onReadoutRef.current(readoutFor(date));
    });

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (!width) return;
      chart.applyOptions({ width, height: height || undefined });
      if (width !== lastWidth) {
        lastWidth = width;
        chart.timeScale().fitContent();
      }
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
    const chart = chartRef.current;
    if (!chart) return;

    // Switching type means a different series class, so the old one is
    // removed and rebuilt rather than mutated.
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
      priceLinesRef.current = [];
    }

    const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));

    if (chartType === 'area') {
      const area = chart.addSeries(AreaSeries, {
        lineColor: tokenWarna('primary-container', '#0ea5e9'),
        topColor: 'rgba(14,165,233,0.28)',
        bottomColor: 'rgba(14,165,233,0.02)',
        lineWidth: 2,
      });
      area.setData(sorted.map((b) => ({ time: b.date as Time, value: b.close })));
      seriesRef.current = area;
    } else {
      const candles = chart.addSeries(CandlestickSeries, {
        upColor: tokenWarna('state-positive', '#10b981'),
        downColor: tokenWarna('state-negative', '#f43f5e'),
        borderVisible: false,
        wickUpColor: tokenWarna('state-positive', '#10b981'),
        wickDownColor: tokenWarna('state-negative', '#f43f5e'),
      });
      candles.setData(
        sorted.map((b) => ({
          time: b.date as Time,
          open: b.open ?? b.close,
          high: b.high ?? b.close,
          low: b.low ?? b.close,
          close: b.close,
        })),
      );
      seriesRef.current = candles;
    }

    createSeriesMarkers(seriesRef.current, toMarkers(patterns));

    volumeSeriesRef.current?.setData(
      sorted.map((b, i) => {
        const prevClose = i > 0 ? sorted[i - 1].close : b.close;
        return { time: b.date as Time, value: b.volume, color: b.close >= prevClose ? `${tokenWarna('state-positive', '#10b981')}66` : `${tokenWarna('state-negative', '#f43f5e')}66` };
      }),
    );

    chart.timeScale().fitContent();
  }, [bars, patterns, chartType, tema]);

  // Warna rangka chart diterapkan ulang saat tema berganti. Membuat ulang
  // instansi chart akan menghilangkan posisi zoom dan garis yang sudah digambar
  // pengguna, jadi cukup opsinya yang diperbarui.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const garis = tokenWarna('border-subtle', '#262626');
    chart.applyOptions({
      layout: { background: { color: 'transparent' }, textColor: tokenWarna('text-muted', '#a3a3a3') },
      grid: { vertLines: { color: garis }, horzLines: { color: garis } },
      timeScale: { borderColor: garis },
      rightPriceScale: { borderColor: garis },
    });
  }, [tema]);

  // Re-fit on demand — the "reset zoom" control in the toolbar.
  useEffect(() => {
    if (resetSignal === 0) return;
    chartRef.current?.timeScale().fitContent();
  }, [resetSignal]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Rebuild MA line series to match however many periods are enabled (0 by default).
    for (const s of maSeriesRef.current) chart.removeSeries(s);
    maSeriesRef.current = movingAverages.map((ma, i) =>
      chart.addSeries(LineSeries, { color: maColors()[i % maColors().length], lineWidth: 2, title: ma.label }),
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
        rsiSeriesRef.current = chart.addSeries(LineSeries, { color: tokenWarna('accent-hover', '#38bdf8'), lineWidth: 1 }, 1);
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
