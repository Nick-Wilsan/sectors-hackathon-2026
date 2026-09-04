import { IndicatorPicker } from './IndicatorPicker';

interface ChartToolbarProps {
  rangeDays: 30 | 90;
  onRangeChange: (days: 30 | 90) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  showMA: boolean;
  showRsi: boolean;
  onToggleMA: () => void;
  onToggleRsi: () => void;
}

// Deliberately minimal beyond timeframe/indicators: no replay, no alerts, no
// "Trade"/"Publikasi" button. We have no such backend capability, and a
// Trade-styled button specifically risks reading as trade execution (PRD
// B-03) even if inert, so it's left out rather than added as decoration.
export function ChartToolbar({
  rangeDays,
  onRangeChange,
  onToggleFullscreen,
  isFullscreen,
  showMA,
  showRsi,
  onToggleMA,
  onToggleRsi,
}: ChartToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-3 py-1.5">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {([30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => onRangeChange(d)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                rangeDays === d ? 'bg-brand text-neutral-950' : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {d === 30 ? '1Bln' : '3Bln'}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-neutral-800" />
        <IndicatorPicker showMA={showMA} showRsi={showRsi} onToggleMA={onToggleMA} onToggleRsi={onToggleRsi} />
      </div>
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
        className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
      >
        {isFullscreen ? '⤡' : '⤢'}
      </button>
    </div>
  );
}
