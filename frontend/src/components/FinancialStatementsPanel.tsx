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

// Setiap pos memakai definisinya SENDIRI. Sebelumnya hanya tujuh dari tiga
// puluh empat baris yang punya tooltip, dan yang punya pun meminjam definisi
// rasio yang cuma bersinggungan — "Pendapatan" menampilkan penjelasan tentang
// margin laba, "Pendapatan bunga" menampilkan CASA. Uji pengguna 7 September
// 2026 menunjukkan pembaca pemula justru tersandung di nama posnya, jauh
// sebelum sampai ke rasio, dan PRD menetapkan kelengkapan penjelasan istilah
// sebagai metrik keberhasilan yang dinilai.
const ROWS: Record<Statement, Row[]> = {
  labaRugi: [
    { field: 'revenue', label: 'Pendapatan', total: true, glossary: 'Pendapatan' },
    { field: 'cost_of_revenue', label: 'Beban pokok pendapatan', indent: true, glossary: 'Beban pokok pendapatan' },
    { field: 'gross_profit', label: 'Laba kotor', total: true, glossary: 'Laba kotor' },
    { field: 'interest_income', label: 'Pendapatan bunga', indent: true, glossary: 'Pendapatan bunga' },
    { field: 'interest_expense', label: 'Beban bunga', indent: true, glossary: 'Beban bunga' },
    { field: 'net_interest_income', label: 'Pendapatan bunga bersih', total: true, glossary: 'Pendapatan bunga bersih' },
    { field: 'non_interest_income', label: 'Pendapatan non-bunga', indent: true, glossary: 'Pendapatan non-bunga' },
    { field: 'operating_expense', label: 'Beban usaha', indent: true, glossary: 'Beban usaha' },
    { field: 'operating_pnl', label: 'Laba usaha', total: true, glossary: 'Laba usaha' },
    { field: 'ebitda', label: 'EBITDA', total: true, glossary: 'EBITDA' },
    { field: 'earnings_before_tax', label: 'Laba sebelum pajak', total: true, glossary: 'Laba sebelum pajak' },
    { field: 'tax', label: 'Beban pajak', indent: true, glossary: 'Beban pajak' },
    { field: 'earnings', label: 'Laba bersih', total: true, glossary: 'Laba bersih' },
  ],
  neraca: [
    { field: 'cash_only', label: 'Kas', glossary: 'Kas' },
    { field: 'current_assets', label: 'Aset lancar', glossary: 'Aset lancar' },
    { field: 'fixed_assets', label: 'Aset tetap', glossary: 'Aset tetap' },
    { field: 'inventories', label: 'Persediaan', glossary: 'Persediaan' },
    { field: 'gross_loan', label: 'Kredit disalurkan (bruto)', glossary: 'Kredit disalurkan' },
    { field: 'net_loan', label: 'Kredit disalurkan (neto)', glossary: 'Kredit disalurkan' },
    { field: 'total_assets', label: 'Total aset', total: true, glossary: 'Total aset' },
    { field: 'current_liabilities', label: 'Liabilitas lancar', glossary: 'Liabilitas lancar' },
    { field: 'non_current_liabilities', label: 'Liabilitas jangka panjang', glossary: 'Liabilitas jangka panjang' },
    { field: 'total_deposit', label: 'Simpanan nasabah', glossary: 'Simpanan nasabah' },
    { field: 'total_liabilities', label: 'Total liabilitas', total: true, glossary: 'Total liabilitas' },
    { field: 'total_debt', label: 'Utang berbunga', glossary: 'Utang berbunga' },
    { field: 'net_debt', label: 'Utang bersih', glossary: 'Utang bersih' },
    { field: 'retained_earnings', label: 'Saldo laba ditahan', glossary: 'Saldo laba ditahan' },
    { field: 'total_equity', label: 'Total ekuitas', total: true, glossary: 'Total ekuitas' },
  ],
  arusKas: [
    { field: 'operating_cash_flow', label: 'Arus kas dari operasi', total: true, glossary: 'Arus kas dari operasi' },
    { field: 'investing_cash_flow', label: 'Arus kas dari investasi', glossary: 'Arus kas dari investasi' },
    { field: 'financing_cash_flow', label: 'Arus kas dari pendanaan', glossary: 'Arus kas dari pendanaan' },
    { field: 'capital_expenditure', label: 'Belanja modal', indent: true, glossary: 'Belanja modal' },
    { field: 'free_cash_flow', label: 'Arus kas bebas', total: true, glossary: 'Arus kas bebas' },
    { field: 'net_cash_flow', label: 'Kenaikan/penurunan kas bersih', total: true, glossary: 'Kenaikan/penurunan kas bersih' },
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
              <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">
                <GlossaryTerm term="YoY">YoY</GlossaryTerm>
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

      {/* Dulu satu blok abu-abu berukuran kecil setinggi empat baris. Isinya
          sebenarnya tiga keterangan berbeda, jadi sekarang ditulis sebagai
          tiga baris berikon dengan kata kuncinya ditebalkan — bisa dipindai,
          bukan hanya dibaca dari ujung ke ujung. */}
      <div className="mt-space-12 grid grid-cols-1 items-start gap-space-8 border-t border-border-subtle pt-space-12 md:grid-cols-3">
        {[
          {
            ikon: 'receipt_long',
            judul: 'Apa adanya',
            teks: <>Angka disalin dari laporan emiten <strong className="text-text-secondary">tanpa penyesuaian</strong> apa pun.</>,
          },
          {
            ikon: 'account_balance',
            judul: 'Bank berbeda',
            teks: <>Struktur laporan bank tidak sama dengan perusahaan lain, sehingga <strong className="text-text-secondary">pos yang tampil menyesuaikan jenis usahanya</strong>.</>,
          },
          {
            ikon: 'palette',
            judul: 'Warna netral',
            teks: <>Beban yang naik bukan kabar baik, pendapatan yang naik bukan otomatis kabar baik. Panah menyatakan <strong className="text-text-secondary">arah angka, bukan penilaian</strong>.</>,
          },
        ].map((k) => (
          <div key={k.judul} className="flex items-start gap-space-8 rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
            <span className="material-symbols-outlined mt-[1px] shrink-0 text-[18px] text-primary">{k.ikon}</span>
            <span>
              <span className="block font-body-md text-body-md font-semibold text-text-primary">{k.judul}</span>
              <span className="mt-space-2 block font-body-md text-body-md leading-relaxed text-text-muted">{k.teks}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
