import { Link } from 'react-router-dom';
import type { MostTradedRow } from '../api/types';

interface VolumeLeadersTableProps {
  mostTraded: MostTradedRow[];
}

/** Compact Indonesian magnitude suffixes so a 12-digit rupiah figure still fits a table cell. */
function formatIdrCompact(value: number): string {
  const num = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (value >= 1e12) return `Rp ${num(value / 1e12)} T`;
  if (value >= 1e9) return `Rp ${num(value / 1e9)} M`;
  if (value >= 1e6) return `Rp ${num(value / 1e6)} jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatShares(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} mlr`;
  return `${(value / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
}

// Structure ported from the reference mockup's "Paling Ramai Diperdagangkan"
// table. Its "Net Foreign Flow" and "Health Score" columns are gone rather
// than stubbed: Sectors exposes no order-flow feed, and a real per-symbol
// composite score pulls in that symbol's whole sub-sector peer group (the
// same cost the screener pays), which is not worth spending per row here.
// The remaining five columns are all real values from data already fetched.
export function VolumeLeadersTable({ mostTraded }: VolumeLeadersTableProps) {
  return (
    <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16 lg:col-span-6">
      <div>
        <div className="mb-space-12 flex items-center justify-between gap-space-8">
          <div className="flex items-center gap-space-8">
            <span className="material-symbols-outlined text-[18px] text-primary-container">equalizer</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Paling Ramai Diperdagangkan</h2>
          </div>
          <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">Penutupan terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle font-table-header text-table-header uppercase text-text-muted">
                <th className="py-space-6 font-semibold">Emiten</th>
                <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">Harga (Rp)</th>
                <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">Chg (%)</th>
                <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">Volume (Lembar)</th>
                <th
                  className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap"
                  title="Estimasi: volume × harga penutupan. Bukan nilai transaksi resmi bursa (yang memakai harga rata-rata tertimbang)."
                >
                  Nilai (Est.)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40 font-body-sm text-body-sm">
              {mostTraded.map((r) => {
                const symbolShort = r.symbol.replace('.JK', '');
                const change = r.priceChange;
                return (
                  <tr key={r.symbol} className="cursor-pointer transition-colors hover:bg-surface-container-low">
                    {/* `w-full max-w-0` hands this column all the leftover width
                        while still letting the company name truncate — without the
                        max-w-0 the name pushes the numeric columns off the card. */}
                    <td className="w-full max-w-0 py-space-8">
                      <Link to={`/emiten/${symbolShort}`} className="flex items-baseline gap-space-6">
                        <span className="shrink-0 font-headline-sm text-headline-sm font-bold text-text-primary">{symbolShort}</span>
                        <span className="hidden truncate font-body-sm text-body-sm text-text-muted sm:inline">{r.companyName}</span>
                      </Link>
                    </td>
                    <td className="py-space-8 pl-space-12 text-right whitespace-nowrap font-label-mono-md text-label-mono-md tabular-nums text-text-primary">
                      {r.price.toLocaleString('id-ID')}
                    </td>
                    <td
                      className={`py-space-8 pl-space-12 text-right whitespace-nowrap font-label-mono-md text-label-mono-md font-semibold tabular-nums ${
                        change === null ? 'text-text-muted' : change >= 0 ? 'text-state-positive' : 'text-state-negative'
                      }`}
                      title={change === null ? 'Emiten ini tidak masuk daftar teramai pada hari bursa sebelumnya' : undefined}
                    >
                      {change === null ? '—' : `${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%`}
                    </td>
                    <td className="py-space-8 pl-space-12 text-right whitespace-nowrap font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
                      {formatShares(r.volume)}
                    </td>
                    <td className="py-space-8 pl-space-12 text-right whitespace-nowrap font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
                      {formatIdrCompact(r.volume * r.price)}
                    </td>
                  </tr>
                );
              })}
              {mostTraded.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-space-24 text-center font-body-sm text-body-sm text-text-muted">
                    Data emiten teramai belum tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-space-8 flex flex-wrap items-center justify-between gap-space-8 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="flex items-center gap-space-4">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          Peringkat berdasarkan volume harian, bukan sinyal beli/jual.
        </span>
        <a href="#screener" className="flex items-center gap-space-2 font-semibold text-primary transition-colors hover:text-accent-hover">
          Lihat Screener Lengkap <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
    </div>
  );
}
