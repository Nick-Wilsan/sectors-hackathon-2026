interface IndicatorPickerProps {
  showMA: boolean;
  showRsi: boolean;
  onToggleMA: () => void;
  onToggleRsi: () => void;
}

// Indicators are OFF by default (Technical Spec update: matches TradingView's
// "add indicator yourself" convention instead of always-on overlays) — this
// is the picker that turns them on.
export function IndicatorPicker({ showMA, showRsi, onToggleMA, onToggleRsi }: IndicatorPickerProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleMA}
        className={`rounded px-2 py-1 text-xs font-medium ${
          showMA ? 'bg-brand text-neutral-950' : 'text-neutral-400 hover:bg-neutral-800'
        }`}
      >
        MA
      </button>
      <button
        onClick={onToggleRsi}
        className={`rounded px-2 py-1 text-xs font-medium ${
          showRsi ? 'bg-brand text-neutral-950' : 'text-neutral-400 hover:bg-neutral-800'
        }`}
      >
        RSI
      </button>
    </div>
  );
}
