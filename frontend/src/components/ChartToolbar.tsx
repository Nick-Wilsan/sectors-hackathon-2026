import type { ChartType } from './PriceChart';

export type RangeDays = 5 | 30 | 90;

interface ChartToolbarProps {
  rangeDays: RangeDays;
  onRangeChange: (days: RangeDays) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  showMA: boolean;
  showRsi: boolean;
  showPatterns: boolean;
  onToggleMA: () => void;
  onToggleRsi: () => void;
  onTogglePatterns: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

// The reference mockup offers 1D/5D/1M/3M/6M/YTD/1Y/5Y/Semua. Sectors' daily
// endpoint returns roughly 90 calendar days (62 trading bars for BBCA), so
// anything past 3 months has no data behind it. Rather than render six
// buttons that cannot work, the row lists only the ranges that do — the note
// under the chart says why the longer ones are absent.
const RANGES: { days: RangeDays; label: string }[] = [
  { days: 5, label: '5H' },
  { days: 30, label: '1B' },
  { days: 90, label: '3B' },
];

function Segment({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm transition-colors ${
        active ? 'bg-surface-container font-bold text-primary-container' : 'text-text-muted hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({ onClick, title, icon, active = false }: { onClick: () => void; title: string; icon: string; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-[28px] w-[28px] items-center justify-center rounded transition-colors ${
        active ? 'bg-surface-container text-primary-container' : 'text-text-muted hover:bg-surface-container hover:text-text-primary'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

export function ChartToolbar({
  rangeDays,
  onRangeChange,
  chartType,
  onChartTypeChange,
  showMA,
  showRsi,
  showPatterns,
  onToggleMA,
  onToggleRsi,
  onTogglePatterns,
  onReset,
  onToggleFullscreen,
  isFullscreen,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-8 border-b border-border-subtle bg-surface-card px-space-12 py-space-6">
      <div className="flex flex-wrap items-center gap-space-8">
        <div className="inline-flex rounded border border-border-subtle bg-background-base p-space-2">
          {RANGES.map((r) => (
            <Segment key={r.days} active={rangeDays === r.days} onClick={() => onRangeChange(r.days)}>
              {r.label}
            </Segment>
          ))}
        </div>

        <span className="h-4 w-px bg-border-subtle" />

        <div className="inline-flex rounded border border-border-subtle bg-background-base p-space-2">
          <Segment active={chartType === 'candles'} onClick={() => onChartTypeChange('candles')} title="Grafik lilin (OHLC)">
            Candles
          </Segment>
          <Segment active={chartType === 'area'} onClick={() => onChartTypeChange('area')} title="Grafik garis harga penutupan">
            Garis
          </Segment>
        </div>

        <span className="h-4 w-px bg-border-subtle" />

        <div className="inline-flex rounded border border-border-subtle bg-background-base p-space-2">
          <Segment active={showMA} onClick={onToggleMA} title="Moving Average 20 & 50 hari">
            MA 20/50
          </Segment>
          <Segment active={showRsi} onClick={onToggleRsi} title="Relative Strength Index 14 hari">
            RSI
          </Segment>
          <Segment active={showPatterns} onClick={onTogglePatterns} title="Tandai pola candlestick pada grafik">
            Pola
          </Segment>
        </div>
      </div>

      <div className="flex items-center gap-space-2">
        <IconButton onClick={onReset} title="Kembalikan tampilan grafik" icon="restart_alt" />
        <IconButton
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          icon={isFullscreen ? 'close_fullscreen' : 'open_in_full'}
          active={isFullscreen}
        />
      </div>
    </div>
  );
}
