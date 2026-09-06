import type { DrawingTool } from './PriceChart';

interface DrawingToolbarProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClearAll: () => void;
}

// Every icon here is wired to behaviour that actually runs: the cursor tool
// releases the chart back to pan/zoom, the horizontal tool drops a real price
// line at the clicked level, the trend tool draws a real two-point line, the
// ruler reports the measured change between two clicked points, and the zone
// tool marks a price band. The reference mockup shows seven icons; we ship
// five plus clear rather than padding the strip with tools that do nothing.
//
// The ruler measures and stops there — distance between two points the user
// chose. It draws no projection and states no target, which is the line this
// product does not cross.
const TOOLS: { key: DrawingTool; label: string; icon: string }[] = [
  { key: 'none', label: 'Kursor — geser & zoom grafik', icon: 'near_me' },
  { key: 'horizontal', label: 'Garis harga — klik satu titik', icon: 'horizontal_rule' },
  { key: 'trendline', label: 'Garis tren — klik dua titik', icon: 'trending_up' },
  { key: 'measure', label: 'Penggaris — klik dua titik untuk mengukur selisih harga, persen, dan jumlah hari bursa', icon: 'straighten' },
  { key: 'zone', label: 'Zona harga — klik dua titik untuk menandai batas atas dan bawah', icon: 'select_all' },
];

export function DrawingToolbar({ tool, onToolChange, onClearAll }: DrawingToolbarProps) {
  return (
    <div className="flex w-[40px] shrink-0 flex-col items-center gap-space-2 border-r border-border-subtle bg-surface-card py-space-8">
      {TOOLS.map((t) => (
        <button
          key={t.key}
          type="button"
          title={t.label}
          aria-label={t.label}
          aria-pressed={tool === t.key}
          onClick={() => onToolChange(t.key)}
          className={`flex h-[28px] w-[28px] items-center justify-center rounded transition-colors ${
            tool === t.key
              ? 'bg-primary-container text-background-base'
              : 'text-text-muted hover:bg-surface-container hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">{t.icon}</span>
        </button>
      ))}

      <span className="my-space-4 h-px w-5 bg-border-subtle" />

      <button
        type="button"
        title="Hapus semua garis yang digambar"
        aria-label="Hapus semua garis yang digambar"
        onClick={onClearAll}
        className="flex h-[28px] w-[28px] items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-container hover:text-state-negative"
      >
        <span className="material-symbols-outlined text-[17px]">delete</span>
      </button>
    </div>
  );
}
