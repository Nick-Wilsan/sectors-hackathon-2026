import type { IndexPoint } from '../api/types';

interface IhsgAreaChartProps {
  points: IndexPoint[];
  positive: boolean;
  height?: number;
}

const VIEW_W = 720;

// Full-width gradient area chart for the IHSG hero — same real daily-close
// series as the old sparkline, just given the visual weight the dashboard's
// centerpiece number deserves instead of a thumbnail-sized line.
export function IhsgAreaChart({ points, positive, height = 160 }: IhsgAreaChartProps) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const color = positive ? '#10b981' : '#f43f5e';
  const gradientId = `ihsg-gradient-${positive ? 'up' : 'down'}`;

  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * VIEW_W;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  const linePath = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${coords[0].x.toFixed(1)},${height} ${linePath} ${coords[coords.length - 1].x.toFixed(1)},${height}`;

  const last = coords[coords.length - 1];
  const gridLines = [0.25, 0.5, 0.75].map((f) => height * f);

  const firstLabel = points[0]?.date;
  const lastLabel = points[points.length - 1]?.date;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${VIEW_W} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((y) => (
          <line key={y} x1="0" x2={VIEW_W} y1={y} y2={y} stroke="#262626" strokeDasharray="3 3" strokeWidth="1" />
        ))}
        <polygon points={areaPath} fill={`url(#${gradientId})`} />
        <polyline points={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
        <circle cx={last.x} cy={last.y} r="7" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>
      {firstLabel && lastLabel && (
        <div className="mt-1 flex justify-between text-[10px] text-neutral-600">
          <span>{firstLabel}</span>
          <span>{lastLabel}</span>
        </div>
      )}
    </div>
  );
}
