import { Link } from 'react-router-dom';
import type { MostTradedRow, MoverRow } from '../api/types';

interface VolumeLeadersTableProps {
  mostTraded: MostTradedRow[];
  gainers: MoverRow[];
  losers: MoverRow[];
}

// Structure ported from the reference mockup's "Paling Ramai Diperdagangkan"
// table. Two of its six columns (Net Foreign Flow, Health Score) show data
// the Sectors API doesn't expose (no order-flow feed) or that would be too
// credit-expensive to compute live for an 8-row decorative table (a real
// per-symbol composite score pulls in its whole sub-sector's peer group,
// same as the screener) — those cells are marked pending rather than faked.
export function VolumeLeadersTable({ mostTraded, gainers, losers }: VolumeLeadersTableProps) {
  const changeBySymbol = new Map<string, number>();
  for (const m of [...gainers, ...losers]) changeBySymbol.set(m.symbol, m.priceChange);

  return (
    <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16 lg:col-span-7">
      <div>
        <div className="mb-space-12 flex items-center justify-between">
          <div className="flex items-center gap-space-8">
            <span className="material-symbols-outlined text-[18px] text-primary-container">equalizer</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Paling Ramai Diperdagangkan (Top Volume &amp; Value)</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle font-table-header text-table-header uppercase text-text-muted">
                <th className="py-space-6 font-semibold">Emiten</th>
                <th className="py-space-6 text-right font-semibold">Harga (Rp)</th>
                <th className="py-space-6 text-right font-semibold">Chg (%)</th>
                <th className="py-space-6 text-right font-semibold">Volume (Lot)</th>
                <th className="py-space-6 text-right font-semibold" title="Data order-flow tidak disediakan Sectors API">
                  Net Foreign Flow
                </th>
                <th className="py-space-6 text-right font-semibold" title="Lihat skor lengkap di halaman emiten">
                  Health Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40 font-body-sm text-body-sm">
              {mostTraded.map((r) => {
                const symbolShort = r.symbol.replace('.JK', '');
                const change = changeBySymbol.get(r.symbol);
                return (
                  <tr key={r.symbol} className="cursor-pointer transition-colors hover:bg-surface-container-low">
                    <td className="py-space-8">
                      <Link to={`/emiten/${symbolShort}`} className="flex items-center gap-space-6">
                        <span className="font-headline-sm text-headline-sm font-bold text-text-primary">{symbolShort}</span>
                        <span className="hidden font-body-sm text-body-sm text-text-muted sm:inline">{r.companyName}</span>
                      </Link>
                    </td>
                    <td className="py-space-8 text-right font-label-mono-md text-label-mono-md text-text-primary">
                      {r.price.toLocaleString('id-ID')}
                    </td>
                    <td
                      className={`py-space-8 text-right font-label-mono-md text-label-mono-md font-semibold ${
                        change === undefined ? 'text-text-muted' : change >= 0 ? 'text-state-positive' : 'text-state-negative'
                      }`}
                    >
                      {change === undefined ? '—' : `${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%`}
                    </td>
                    <td className="py-space-8 text-right font-label-mono-sm text-label-mono-sm text-text-secondary">
                      {(r.volume / 1e6).toFixed(1)} jt
                    </td>
                    <td className="py-space-8 text-right">
                      <span
                        className="inline-flex items-center gap-space-2 rounded-full bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm text-text-muted"
                        title="Data order-flow tidak disediakan Sectors API"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-text-muted/60" />—
                      </span>
                    </td>
                    <td className="py-space-8 text-right">
                      <Link
                        to={`/emiten/${symbolShort}`}
                        className="inline-flex items-center gap-space-2 rounded-full bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm text-text-muted hover:text-text-primary"
                        title="Skor komposit lengkap ada di halaman emiten — belum kami hitung di sini demi menghindari biaya kredit per-baris"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-text-muted/60" />
                        Lihat
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-space-8 flex flex-wrap items-center justify-between gap-space-8 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="flex items-center gap-space-4">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          Net Foreign Flow &amp; Health Score belum tersedia untuk tabel ini — klik "Lihat" untuk skor lengkap per emiten.
        </span>
        <Link to="/#screener" className="flex items-center gap-space-2 font-semibold text-primary transition-colors hover:text-accent-hover">
          Lihat Screener Lengkap <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
