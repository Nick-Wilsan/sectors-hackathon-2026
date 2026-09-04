interface ChartToolbarProps {
  rangeDays: 30 | 90;
  onRangeChange: (days: 30 | 90) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

// Deliberately minimal: only controls that actually do something. No drawing
// tools, replay, alerts, or "Trade" button — we don't have those capabilities,
// and a Trade-looking button specifically risks reading as trade execution
// (PRD B-03), so it's left out on purpose rather than added for decoration.
export function ChartToolbar({ rangeDays, onRangeChange, onToggleFullscreen, isFullscreen }: ChartToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-3 py-1.5">
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
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
        className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
      >
        {isFullscreen ? '⤡ Keluar' : '⤢ Layar Penuh'}
      </button>
    </div>
  );
}
