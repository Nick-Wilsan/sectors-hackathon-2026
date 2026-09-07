import type { MarketRelativeMove } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';

// Market-relative context for F-06, shared by the emiten panel and the
// dashboard strip so both phrase the same measurement the same way.
//
// This block exists to answer the question a bare anomaly flag provokes —
// "so why did it move?" — without inventing an answer. It splits the day's
// move into the part the whole bourse shared and the part it did not. It never
// names an event, and the wording is chosen so it cannot be read as one.

const ORIGIN_LABEL: Record<MarketRelativeMove['origin'], string> = {
  'market-wide': 'Sejalan pasar',
  mixed: 'Sebagian sejalan pasar',
  idiosyncratic: 'Khas emiten ini',
  flat: 'Hampir tidak bergerak',
};

/** Deliberately not green/red: this is a statement about where a move came
 *  from, not about whether the move was good. */
const ORIGIN_TONE: Record<MarketRelativeMove['origin'], string> = {
  'market-wide': 'border-primary-container/40 bg-primary-container/5 text-primary',
  mixed: 'border-border-subtle bg-surface-container-lowest text-text-secondary',
  idiosyncratic: 'border-state-warning/40 bg-state-warning/5 text-state-warning',
  flat: 'border-border-subtle bg-surface-container-lowest text-text-muted',
};

export function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

function Cell({ label, value, glossary }: { label: string; value: string; glossary?: string }) {
  return (
    <div className="rounded border border-border-subtle/60 bg-surface-container-lowest px-space-8 py-space-12">
      <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">
        {glossary ? <GlossaryTerm term={glossary}>{label}</GlossaryTerm> : label}
      </span>
      <span className="block font-label-mono-md text-label-mono-md font-bold tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

export function MarketContextBlock({ context, disclaimer }: { context: MarketRelativeMove; disclaimer: string | null }) {
  return (
    <div className="border-t border-border-subtle pt-space-16">
      <div className="flex flex-wrap items-center gap-space-8">
        <span className="font-table-header text-table-header uppercase text-text-muted">Dibandingkan pasar</span>
        <span
          className={`rounded border px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${ORIGIN_TONE[context.origin]}`}
        >
          {ORIGIN_LABEL[context.origin]}
        </span>
      </div>

      <div className="mt-space-12 grid grid-cols-2 gap-space-6 sm:grid-cols-4">
        <Cell label="Emiten ini" value={formatSignedPercent(context.stockReturn)} />
        <Cell label={context.indexLabel} value={formatSignedPercent(context.marketReturn)} glossary="IHSG" />
        <Cell
          label="Selisih"
          value={`${context.excessReturn >= 0 ? '+' : ''}${(context.excessReturn * 100).toFixed(2)} pp`}
          glossary="Selisih terhadap IHSG"
        />
        {context.sensitivity !== null && (
          <Cell
            label="Sensitivitas"
            value={`${context.sensitivity.toFixed(2)}×`}
            glossary="Sensitivitas terhadap IHSG"
          />
        )}
      </div>

      {/* Kalimatnya diberi jarak sepadan dengan deretan sel di atasnya.
          Dengan jarak 6 piksel, teks ini menempel pada kotak-kotak angka dan
          terbaca seolah masih bagian dari kotak terakhir, bukan keterangan
          atas keempatnya. */}
      <p className="mt-space-16 font-body-sm text-body-sm text-text-secondary">{context.statement}</p>
      {disclaimer && <p className="mt-space-6 font-body-sm text-body-sm text-text-muted">{disclaimer}</p>}
    </div>
  );
}

/** One-line variant for the dashboard strip, where a full block does not fit. */
export function MarketContextLine({ context }: { context: MarketRelativeMove }) {
  return (
    <p className="font-label-mono-sm text-label-mono-sm text-text-secondary">
      <span className="text-text-muted">vs {context.indexLabel}:</span> {formatSignedPercent(context.stockReturn)} vs{' '}
      {formatSignedPercent(context.marketReturn)}{' '}
      <span className={`font-bold ${context.origin === 'idiosyncratic' ? 'text-state-warning' : 'text-text-muted'}`}>
        ({ORIGIN_LABEL[context.origin].toLowerCase()})
      </span>
    </p>
  );
}
