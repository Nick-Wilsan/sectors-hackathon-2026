import type { ReactNode } from 'react';

interface RightPanelProps {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

// Collapsible right sidebar holding everything that isn't the chart itself
// (score, framework, anomaly, peer comparison, pattern list, similarity) —
// the TradingView-style "chart is the star, details tuck away" layout.
export function RightPanel({ open, onToggle, children }: RightPanelProps) {
  return (
    <div className="flex shrink-0">
      <button
        onClick={onToggle}
        title={open ? 'Sembunyikan panel' : 'Tampilkan panel'}
        className="flex w-5 items-center justify-center border-l border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-200"
      >
        {open ? '›' : '‹'}
      </button>
      {open && (
        <div className="w-80 overflow-y-auto border-l border-neutral-800 bg-neutral-950 px-3 py-3 lg:w-96">
          {children}
        </div>
      )}
    </div>
  );
}
