import { useMemo, useState } from 'react';
import type { FinancialYear } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';

// Laporan keuangan delapan tahun.
//
// Sectors mengirim 67 medan per tahun di dalam section `financials` yang sudah
// diambil setiap kali halaman emiten dibuka; sebelumnya hanya `earnings` yang
// dipakai. Panel ini menampilkan sisanya tanpa satu pun panggilan baru — 0 kredit.
//
// Struktur laporan bank dan non-bank berbeda: bank melaporkan pendapatan bunga
// dan kredit yang disalurkan, perusahaan biasa melaporkan harga pokok penjualan
// dan persediaan. Karena itu baris disaring per emiten: baris yang seluruh
// tahunnya kosong tidak dirender sama sekali, bukan diisi strip.

type Statement = 'labaRugi' | 'neraca' | 'arusKas';

interface Row {
  field: string;
  label: string;
  /** Baris turunan yang ditulis agak menjorok agar hierarki laporan terbaca. */
  indent?: boolean;
  /** Baris jumlah, ditebalkan. */
  total?: boolean;
  glossary?: string;
}

const ROWS: Record<Statement, Row[]> = {
  labaRugi: [
    { field: 'revenue', label: 'Pendapatan', total: true, glossary: 'Margin laba' },
    { field: 'cost_of_revenue', label: 'Beban pokok pendapatan', indent: true },
    { field: 'gross_profit', label: 'Laba kotor', total: true },
    { field: 'interest_income', label: 'Pendapatan bunga', indent: true, glossary: 'CASA' },
    { field: 'interest_expense', label: 'Beban bunga', indent: true },
    { field: 'net_interest_income', label: 'Pendapatan bunga bersih', total: true },
    { field: 'non_interest_income', label: 'Pendapatan non-bunga', indent: true },
    { field: 'operating_expense', label: 'Beban usaha', indent: true },
    { field: 'operating_pnl', label: 'Laba usaha', total: true },
    { field: 'ebitda', label: 'EBITDA', total: true },
    { field: 'earnings_before_tax', label: 'Laba sebelum pajak', total: true },
    { field: 'tax', label: 'Beban pajak', indent: true },
    { field: 'earnings', label: 'Laba bersih', total: true, glossary: 'Margin laba' },
  ],
  neraca: [
    { field: 'cash_only', label: 'Kas' },
    { field: 'current_assets', label: 'Aset lancar' },
    { field: 'fixed_assets', label: 'Aset tetap' },
    { field: 'inventories', label: 'Persediaan' },
    { field: 'gross_loan', label: 'Kredit disalurkan (bruto)' },
    { field: 'net_loan', label: 'Kredit disalurkan (neto)' },
    { field: 'total_assets', label: 'Total aset', total: true, glossary: 'ROA' },
    { field: 'current_liabilities', label: 'Liabilitas lancar' },
    { field: 'non_current_liabilities', label: 'Liabilitas jangka panjang' },
    { field: 'total_deposit', label: 'Simpanan nasabah', glossary: 'DER' },
    { field: 'total_liabilities', label: 'Total liabilitas', total: true, glossary: 'DER' },
    { field: 'total_debt', label: 'Utang berbunga' },
    { field: 'net_debt', label: 'Utang bersih' },
    { field: 'retained_earnings', label: 'Saldo laba ditahan' },
    { field: 'total_equity', label: 'Total ekuitas', total: true, glossary: 'PBV' },
  ],
  arusKas: [
    { field: 'operating_cash_flow', label: 'Arus kas dari operasi', total: true, glossary: 'Margin Arus Kas Operasional' },
    { field: 'investing_cash_flow', label: 'Arus kas dari investasi' },
    { field: 'financing_cash_flow', label: 'Arus kas dari pendanaan' },
    { field: 'capital_expenditure', label: 'Belanja modal', indent: true },
    { field: 'free_cash_flow', label: 'Arus kas bebas', total: true },
    { field: 'net_cash_flow', label: 'Kenaikan/penurunan kas bersih', total: true },
  ],
};

const TABS: { key: Statement; label: string }[] = [
  { key: 'labaRugi', label: 'Laba Rugi' },
  { key: 'neraca', label: 'Neraca' },
  { key: 'arusKas', label: 'Arus Kas' },
];

/** Rupiah ringkas — laporan emiten besar bernilai ratusan triliun. */
function formatIdr(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  const n = (x: number) => x.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${n(abs / 1e12)} T`;
  if (abs >= 1e9) return `${sign}${n(abs / 1e9)} M`;
  if (abs >= 1e6) return `${sign}${n(abs / 1e6)} jt`;
  return `${sign}${n(abs)}`;
}

/** Garis tren enam tahun untuk satu pos. Warnanya netral dengan sengaja:
 *  pos beban yang naik bukan kabar baik, jadi hijau-merah di sini akan
 *  menyiratkan penilaian yang tidak dibuat produk ini. */
function Sparkline({ values }: { values: (number | null)[] }) {
  const points = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || Math.abs(max) || 1;
  const w = 64;
  const h = 18;
  const coords = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / span) * h}`);
  const naik = points[points.length - 1] >= points[0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-4 w-16" role="img" aria-label={naik ? 'tren menaik' : 'tren menurun'}>
      <polyline points={coords.join(' ')} fill="none" stroke="var(--color-primary-container)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      <circle cx={w} cy={h - ((points[points.length - 1] - min) / span) * h} r={1.8} fill="var(--color-accent-hover)" />
    </svg>
  );
}

/** Perubahan tahun terakhir terhadap tahun sebelumnya. */
function yoy(values: (number | null)[]): number | null {
  const [terbaru, sebelumnya] = values;
  if (terbaru === null || sebelumnya === null || sebelumnya === 0) return null;
  return (terbaru - sebelumnya) / Math.abs(sebelumnya);
}

export function FinancialStatementsPanel({ symbol, rows }: { symbol: string; rows: FinancialYear[] }) {
  const [tab, setTab] = useState<Statement>('labaRugi');

  // Delapan tahun terlalu lebar untuk layar sempit; enam terakhir sudah cukup
  // untuk membaca arah, dan tabelnya tetap dapat digulir mendatar.
  const years = useMemo(() => [...rows].sort((a, b) => b.year - a.year).slice(0, 6), [rows]);

  // Hanya baris yang benar-benar dilaporkan emiten ini yang dirender.
  const visibleRows = useMemo(
    () => ROWS[tab].filter((r) => years.some((y) => y[r.field] !== null && y[r.field] !== undefined)),
    [tab, years],
  );

  if (years.length === 0) return null;

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex flex-col gap-space-8 border-b border-border-subtle pb-space-12 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">account_balance</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">
              Laporan Keuangan {symbol.toUpperCase().replace(/\.JK$/, '')}
            </h2>
            <p className="font-body-sm text-body-sm text-text-muted">
              Angka tahunan yang dilaporkan emiten, dalam rupiah. Baris yang tidak dilaporkan tidak ditampilkan.
            </p>
          </div>
        </div>
        <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">
          Tahun buku {years[years.length - 1].year}&ndash;{years[0].year}
        </span>
      </div>

      <div className="mt-space-12 flex gap-space-2 rounded border border-border-subtle bg-background-base p-space-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={
              tab === t.key
                ? 'flex-1 rounded bg-surface-container px-space-8 py-space-6 font-body-sm text-body-sm font-semibold text-primary'
                : 'flex-1 rounded px-space-8 py-space-6 font-body-sm text-body-sm text-text-muted transition-colors hover:text-text-secondary'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-space-12 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle font-table-header text-table-header uppercase text-text-muted">
              <th className="py-space-6 font-semibold whitespace-nowrap">Pos</th>
              {years.map((y) => (
                <th key={y.year} className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">
                  {y.year}
                </th>
              ))}
              <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap" title="Perubahan tahun terakhir terhadap tahun sebelumnya">
                YoY
              </th>
              <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">
                Tren {years[years.length - 1].year}&ndash;{years[0].year}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/40">
            {visibleRows.map((r) => (
              <tr
                key={r.field}
                className={
                  r.total
                    ? 'bg-surface-container-lowest/60 transition-colors hover:bg-surface-container-low'
                    : 'transition-colors hover:bg-surface-container-low'
                }
              >
                <td className={`py-space-8 whitespace-nowrap ${r.indent ? 'pl-space-12' : ''}`}>
                  <span
                    className={
                      r.total
                        ? 'font-body-sm text-body-sm font-bold text-text-primary'
                        : 'font-body-sm text-body-sm text-text-secondary'
                    }
                  >
                    {r.glossary ? <GlossaryTerm term={r.glossary}>{r.label}</GlossaryTerm> : r.label}
                  </span>
                </td>
                {years.map((y) => {
                  const raw = y[r.field] ?? null;
                  const text = formatIdr(raw);
                  return (
                    <td
                      key={y.year}
                      className={`py-space-8 pl-space-12 text-right font-label-mono-md text-label-mono-md tabular-nums whitespace-nowrap ${
                        text === null
                          ? 'text-text-muted'
                          : raw !== null && raw < 0
                            ? 'text-state-negative'
                            : r.total
                              ? 'font-bold text-text-primary'
                              : 'text-text-secondary'
                      }`}
                    >
                      {text ?? 'tidak dilaporkan'}
                    </td>
                  );
                })}
                {(() => {
                  const seri = years.map((y) => (y[r.field] ?? null) as number | null);
                  const perubahan = yoy(seri);
                  return (
                    <>
                      <td className="py-space-8 pl-space-12 text-right whitespace-nowrap">
                        {perubahan === null ? (
                          <span className="font-label-mono-sm text-label-mono-sm text-text-muted">&mdash;</span>
                        ) : (
                          <span className="inline-flex items-center gap-space-2 font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
                            <span className="material-symbols-outlined text-[13px]">{perubahan >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                            {Math.abs(perubahan * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="py-space-8 pl-space-12">
                        <span className="flex justify-end">
                          {/* Urutan kolom terbaru-dulu, sparkline dibaca kiri-ke-kanan
                              dari tahun terlama, jadi serinya dibalik. */}
                          <Sparkline values={[...seri].reverse()} />
                        </span>
                      </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-space-8 flex items-start gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
        <span>
          Angka disajikan apa adanya dari laporan emiten, tanpa penyesuaian. Struktur laporan bank berbeda dari perusahaan
          lain, sehingga pos yang tampil menyesuaikan jenis usahanya. Garis tren dan panah YoY sengaja berwarna netral:
          beban yang naik bukan kabar baik dan pendapatan yang naik bukan otomatis kabar baik, sehingga arah panah
          menyatakan pergerakan angka, bukan penilaian atasnya.
        </span>
      </p>
    </div>
  );
}
