interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

/** Minimal inline SVG line chart — deliberately not a full lightweight-charts
 * instance, since a market-overview card just needs a shape, not interactivity. */
export function Sparkline({ values, width = 120, height = 36, color = '#10b981' }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
