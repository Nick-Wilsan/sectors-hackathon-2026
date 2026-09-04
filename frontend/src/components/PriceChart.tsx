import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, createSeriesMarkers, type IChartApi, type ISeriesApi, type SeriesMarker, type Time } from 'lightweight-charts';
import type { DailyBar, PatternMatch } from '../api/types';

interface PriceChartProps {
  bars: DailyBar[];
  patterns?: PatternMatch[];
}

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

export function PriceChart({ bars, patterns = [] }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#a3a3a3' },
      grid: { vertLines: { color: '#262626' }, horzLines: { color: '#262626' } },
      height: 360,
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

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // Chart instance is created once; data updates happen in the effect below.
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
    chartRef.current?.timeScale().fitContent();
  }, [bars, patterns]);

  return <div ref={containerRef} className="w-full" />;
}
