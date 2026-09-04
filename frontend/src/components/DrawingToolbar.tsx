import type { DrawingTool } from './PriceChart';

interface DrawingToolbarProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClearAll: () => void;
}

const TOOLS: { key: DrawingTool; label: string; icon: string }[] = [
  { key: 'none', label: 'Kursor', icon: '↖' },
  { key: 'horizontal', label: 'Garis Horizontal', icon: '—' },
  { key: 'trendline', label: 'Garis Tren (klik 2 titik)', icon: '⟋' },
];

// Real drawing tools (horizontal price line, 2-click trend line) — not a
// decorative icon strip. Scoped smaller than TradingView's full drawing
// suite deliberately: these two cover the common "mark a level" use case
// without pretending we have a full annotation engine.
export function DrawingToolbar({ tool, onToolChange, onClearAll }: DrawingToolbarProps) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-neutral-800 bg-neutral-900 py-2">
      {TOOLS.map((t) => (
        <button
          key={t.key}
          title={t.label}
          onClick={() => onToolChange(t.key)}
          className={`flex h-8 w-8 items-center justify-center rounded text-sm ${
            tool === t.key ? 'bg-brand text-neutral-950' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
          }`}
        >
          {t.icon}
        </button>
      ))}
      <div className="my-1 h-px w-6 bg-neutral-800" />
      <button
        title="Hapus semua gambar"
        onClick={onClearAll}
        className="flex h-8 w-8 items-center justify-center rounded text-sm text-neutral-400 hover:bg-neutral-800 hover:text-rose-400"
      >
        🗑
      </button>
    </div>
  );
}
