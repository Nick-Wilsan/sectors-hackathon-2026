import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubsectors, screenCompanies } from '../api/client';
import type { ScoredCompany, ScreenerResult, SubsectorOption } from '../api/types';
import { PeerDataWarning } from './PeerDataWarning';
import { GlossaryTerm } from './GlossaryTerm';

/** Same three tiers the rest of the dashboard uses for composite scores. */
function tierColors(score: number): { bar: string; text: string; chip: string; label: string } {
  if (score >= 67) return { bar: 'bg-state-positive', text: 'text-state-positive', chip: 'bg-state-positive/10 text-state-positive', label: 'Sehat' };
  if (score >= 34) return { bar: 'bg-state-warning', text: 'text-state-warning', chip: 'bg-state-warning/10 text-state-warning', label: 'Netral' };
  return { bar: 'bg-state-negative', text: 'text-state-negative', chip: 'bg-state-negative/10 text-state-negative', label: 'Kritis' };
}

// The screener endpoint already returns every component percentile behind the
// composite score, so the table can show *why* a company ranks where it does
// instead of a single opaque bar. Fixed order and short heads keep the row
// scannable; the full label and weight live in each header's tooltip.
// `glossary` adalah kunci pencarian di kamus istilah, sengaja dipisah dari
// `full` yang merupakan label tampilan. Keduanya sempat disamakan dan empat
// dari lima tooltip diam-diam tidak muncul karena kuncinya tidak pernah cocok.
//
// `unit` menentukan bagaimana penyaring lanjutan menampilkan dan mengirim
// angkanya. Empat rasio disimpan Sectors sebagai pecahan (ROE 0,204 = 20,4%),
// sehingga pengguna mengetik "15" untuk 15% dan nilainya dibagi seratus sebelum
// dikirim. DER adalah rasio telanjang dan dikirim apa adanya. Meminta pemula
// mengetik "0.15" adalah cara tercepat membuat penyaring ini tidak terpakai.
const FACTORS = [
  { key: 'roe', short: 'ROE', full: 'Profitabilitas Modal (ROE)', glossary: 'ROE', weight: '25%', unit: 'persen' },
  { key: 'netProfitMargin', short: 'NPM', full: 'Margin Laba Bersih', glossary: 'Margin laba', weight: '20%', unit: 'persen' },
  { key: 'der', short: 'DER', full: 'Struktur Modal (DER)', glossary: 'DER', weight: '20%', unit: 'rasio' },
  { key: 'ocfMargin', short: 'OCF', full: 'Margin Arus Kas Operasional', glossary: 'Margin Arus Kas Operasional', weight: '20%', unit: 'persen' },
  { key: 'roa', short: 'ROA', full: 'Profitabilitas Aset (ROA)', glossary: 'ROA', weight: '15%', unit: 'persen' },
] as const;

type FactorKey = (typeof FACTORS)[number]['key'];
type RangeInput = { min: string; max: string };

// Sub-sektor terbesar berisi hampir seratus emiten. Menampilkan semuanya
// sekaligus membuat panel ini memanjang jauh melewati sisa dashboard, jadi
// daftarnya dipenggal. Seluruh data sudah ada di browser, sehingga berpindah
// halaman tidak memanggil API dan tidak menagih kredit.
const BARIS_PER_HALAMAN = 10;

const EMPTY_FILTERS: Record<FactorKey, RangeInput> = {
  roe: { min: '', max: '' },
  netProfitMargin: { min: '', max: '' },
  der: { min: '', max: '' },
  ocfMargin: { min: '', max: '' },
  roa: { min: '', max: '' },
};

/** Ubah isian pengguna menjadi nilai mentah yang dipahami backend. */
function toRawValue(text: string, unit: 'persen' | 'rasio'): number | undefined {
  if (text.trim() === '') return undefined;
  const n = Number(text);
  if (!Number.isFinite(n)) return undefined;
  return unit === 'persen' ? n / 100 : n;
}

/** A component percentile: how the company ranks against its own sub-sector on that one factor. */
function FactorCell({ company, factorKey }: { company: ScoredCompany; factorKey: string }) {
  const component = company.components.find((c) => c.key === factorKey);
  if (!component) {
    return <td className="py-space-8 pl-space-12 text-right font-label-mono-sm text-label-mono-sm text-text-muted">—</td>;
  }
  const { text } = tierColors(component.percentile);
  return (
      <td className="py-space-8 pl-space-12 text-right">
        <span
          className={`font-label-mono-md text-label-mono-md font-semibold tabular-nums ${text}`}
          title={`${component.label}: persentil ${component.percentile.toFixed(0)} dari ${component.groupSize} emiten sub-sektor`}
        >
          {component.percentile.toFixed(0)}
        </span>
      </td>
    );
  }

  export function ScreenerPanel() {
    const [subsectors, setSubsectors] = useState<SubsectorOption[]>([]);
    const [subSector, setSubSector] = useState('');
    const [minScore, setMinScore] = useState('');
    const [sortBy, setSortBy] = useState<'score' | FactorKey>('score');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<Record<FactorKey, RangeInput>>(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [halaman, setHalaman] = useState(0);
    const [result, setResult] = useState<ScreenerResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeFilters = FACTORS.filter((f) => filters[f.key].min !== '' || filters[f.key].max !== '').length;

    useEffect(() => {
      getSubsectors()
        .then((list) => {
          setSubsectors(list);
          if (list.length > 0) setSubSector(list[0].subsector);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat daftar sub-sektor'));
    }, []);

    useEffect(() => {
      if (!subSector) return;
      setLoading(true);
      setError(null);
      const componentFilters: Record<string, { min?: number; max?: number }> = {};
      for (const f of FACTORS) {
        const min = toRawValue(filters[f.key].min, f.unit);
        const max = toRawValue(filters[f.key].max, f.unit);
        if (min !== undefined || max !== undefined) componentFilters[f.key] = { min, max };
      }

      setHalaman(0);
      screenCompanies({
        subSector,
        sortBy,
        sortDirection,
        minScore: minScore ? Number(minScore) : undefined,
        componentFilters,
      })
        .then(setResult)
        .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data screener'))
        .finally(() => setLoading(false));
      // `filters` sengaja dibaca lewat JSON.stringify pada daftar dependensi agar
      // efek tidak berjalan ulang setiap render akibat objek baru yang isinya sama.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subSector, minScore, sortBy, sortDirection, JSON.stringify(filters)]);

    const totalHalaman = Math.max(1, Math.ceil((result?.ranked.length ?? 0) / BARIS_PER_HALAMAN));
    const halamanAman = Math.min(halaman, totalHalaman - 1);
    const mulai = halamanAman * BARIS_PER_HALAMAN;
    const barisTampil = result?.ranked.slice(mulai, mulai + BARIS_PER_HALAMAN) ?? [];

    const healthy = result?.ranked.filter((c) => (c.score ?? 0) >= 67).length ?? 0;
    const critical = result?.ranked.filter((c) => (c.score ?? 0) < 34).length ?? 0;

    return (
  <div id="screener" className="scroll-mt-20 rounded border border-border-subtle bg-surface-card p-space-16">
    <div className="flex flex-col gap-space-12 border-b border-border-subtle pb-space-12 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-space-8">
        <span className="material-symbols-outlined text-[18px] text-primary-container">filter_alt</span>
        <div>
          <div className="flex flex-wrap items-center gap-space-8">
            <h2 id="screener-emiten" className="scroll-mt-24 font-headline-sm text-headline-sm font-bold text-text-primary">Screener Emiten</h2>
            {/* Tally rides with the title rather than the control group:
                as a fourth item in that group it had no label above it and
                broke the row into three ragged lines. */}
            {result && !loading && (
              <span className="flex items-center gap-space-8 rounded border border-border-subtle bg-surface-container-lowest px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm">
                <span className="tabular-nums text-state-positive">{healthy} sehat</span>
                <span className="h-3 w-px bg-border-subtle" />
                <span className="tabular-nums text-state-negative">{critical} kritis</span>
                <span className="h-3 w-px bg-border-subtle" />
                <span className="tabular-nums text-text-muted">{result.groupSize} dinilai</span>
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-text-muted">
            Peringkat Skor Komposit Fundamental beserta lima faktor pembentuknya, dibandingkan sesama emiten satu sub-sektor.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-space-8 lg:shrink-0 lg:flex-nowrap">
        <label className="flex flex-col gap-space-4">
          <span className="font-table-header text-table-header uppercase text-text-muted">Sub-sektor</span>
          <select
            value={subSector}
            onChange={(e) => setSubSector(e.target.value)}
            className="h-[32px] rounded border border-border-subtle bg-surface-container-lowest px-space-8 font-body-sm text-body-sm text-text-primary transition-colors focus:border-primary-container focus:outline-none"
          >
            {subsectors.map((s) => (
              <option key={s.subsector} value={s.subsector}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-space-4">
          <span className="font-table-header text-table-header uppercase text-text-muted">Skor minimum</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="0"
            className="h-[32px] w-24 rounded border border-border-subtle bg-surface-container-lowest px-space-8 font-label-mono-md text-label-mono-md tabular-nums text-text-primary transition-colors placeholder:text-text-muted focus:border-primary-container focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-space-4">
          <span className="font-table-header text-table-header uppercase text-text-muted">Urutkan menurut</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | FactorKey)}
            className="h-[32px] rounded border border-border-subtle bg-surface-container-lowest px-space-8 font-body-sm text-body-sm text-text-primary transition-colors focus:border-primary-container focus:outline-none"
          >
            <option value="score">Skor Komposit</option>
            {FACTORS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.full}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
          title={sortDirection === 'desc' ? 'Tertinggi lebih dulu' : 'Terendah lebih dulu'}
          className="flex h-[32px] items-center gap-space-4 rounded border border-border-subtle bg-surface-container-lowest px-space-8 font-body-sm text-body-sm text-text-secondary transition-colors hover:border-surface-variant"
        >
          <span className="material-symbols-outlined text-[16px]">{sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}</span>
          {sortDirection === 'desc' ? 'Tertinggi' : 'Terendah'}
        </button>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={
            activeFilters > 0
              ? 'flex h-[32px] items-center gap-space-4 rounded border border-primary-container bg-primary-container/10 px-space-8 font-body-sm text-body-sm text-primary transition-colors'
              : 'flex h-[32px] items-center gap-space-4 rounded border border-border-subtle bg-surface-container-lowest px-space-8 font-body-sm text-body-sm text-text-secondary transition-colors hover:border-surface-variant'
          }
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Penyaring faktor
          {activeFilters > 0 && (
            <span className="rounded-full bg-primary-container px-space-6 font-label-mono-sm text-label-mono-sm font-bold text-background-base">
              {activeFilters}
            </span>
          )}
        </button>
      </div>
    </div>

    {/* Penyaring per faktor. Mesin skor sudah mendukungnya sejak awal, tetapi
        kontrolnya belum pernah sampai ke layar — sehingga pengguna hanya bisa
        mengurutkan, tidak bisa bertanya "ROE tinggi TAPI utangnya rendah". */}
    {showFilters && (
      <div className="mt-space-12 rounded border border-border-subtle bg-surface-container-lowest p-space-12">
        <div className="flex flex-wrap items-center justify-between gap-space-8">
          <p className="font-body-sm text-body-sm text-text-muted">
            Menyaring berdasarkan <span className="font-semibold text-text-secondary">nilai asli</span> tiap faktor, bukan
            persentilnya. Kosongkan bila tidak dipakai.
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-2 font-body-sm text-body-sm text-text-secondary transition-colors hover:border-surface-variant"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Hapus semua
            </button>
          )}
        </div>

        <div className="mt-space-12 grid grid-cols-1 gap-space-8 sm:grid-cols-2 xl:grid-cols-3">
          {FACTORS.map((f) => (
            <div key={f.key} className="rounded border border-border-subtle/60 bg-surface-card p-space-8">
              <span className="block font-body-sm text-body-sm text-text-secondary">
                <GlossaryTerm term={f.glossary}>{f.full}</GlossaryTerm>
              </span>
              <div className="mt-space-6 flex items-center gap-space-6">
                <input
                  type="number"
                  inputMode="decimal"
                  value={filters[f.key].min}
                  onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: { ...prev[f.key], min: e.target.value } }))}
                  placeholder="min"
                  className="h-[28px] w-full min-w-0 rounded border border-border-subtle bg-background-base px-space-6 font-label-mono-sm text-label-mono-sm tabular-nums text-text-primary placeholder:text-text-muted focus:border-primary-container focus:outline-none"
                />
                <span className="font-label-mono-sm text-label-mono-sm text-text-muted">s.d.</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={filters[f.key].max}
                  onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: { ...prev[f.key], max: e.target.value } }))}
                  placeholder="maks"
                  className="h-[28px] w-full min-w-0 rounded border border-border-subtle bg-background-base px-space-6 font-label-mono-sm text-label-mono-sm tabular-nums text-text-primary placeholder:text-text-muted focus:border-primary-container focus:outline-none"
                />
                <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">{f.unit === 'persen' ? '%' : '×'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {loading && (
      <div className="mt-space-12 flex flex-col gap-space-4" aria-busy="true" aria-label="Memuat data screener">
        {/* Skeleton rows match the real row height so the table does not jump. */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[33px] animate-pulse rounded bg-surface-container-lowest" />
        ))}
      </div>
    )}
    {error && (
      <p className="mt-space-12 rounded border border-state-negative/40 bg-state-negative/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-negative">
        {error}
      </p>
    )}

    {result && !loading && (
      <>
        <div className="mt-space-12">
          <PeerDataWarning failures={result.fetchFailures} groupSize={result.groupSize} />
        </div>

        {/* Mirrors backend's MIN_MEANINGFUL_GROUP_SIZE (percentile.ts) */}
        {result.groupSize < 5 && (
          <p className="mt-space-12 rounded border border-state-warning/40 bg-state-warning/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-warning">
            Sub-sektor ini hanya berisi {result.groupSize} emiten — terlalu sedikit untuk perbandingan persentil yang bermakna. Skor di
            bawah ini sebaiknya tidak dijadikan acuan utama.
          </p>
        )}

        <div className="mt-space-12 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle font-table-header text-table-header uppercase text-text-muted">
                <th className="w-8 py-space-6 text-right font-semibold">#</th>
                <th className="py-space-6 pl-space-12 font-semibold">Emiten</th>
                {FACTORS.map((f) => (
                  <th key={f.key} className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">
                    <GlossaryTerm term={f.glossary} below>
                      {f.short}
                    </GlossaryTerm>
                  </th>
                ))}
                <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">Skor Komposit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {barisTampil.map((c, i) => {
                const symbolShort = c.symbol.replace('.JK', '');
                const score = c.score ?? 0;
                const tier = tierColors(score);
                return (
                  <tr key={c.symbol} className="transition-colors hover:bg-surface-container-low">
                    <td className="py-space-8 text-right font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">{mulai + i + 1}</td>
                    {/* w-full max-w-0 gives this column the leftover width while
                        still letting the company name truncate instead of pushing
                        the numeric columns off the card. */}
                    <td className="w-full max-w-0 py-space-8 pl-space-12">
                      <Link to={`/emiten/${symbolShort}`} className="flex items-baseline gap-space-8">
                        <span className="shrink-0 font-headline-sm text-headline-sm font-bold text-text-primary">{symbolShort}</span>
                        <span className="hidden truncate font-body-sm text-body-sm text-text-muted sm:inline">{c.companyName}</span>
                      </Link>
                    </td>
                    {FACTORS.map((f) => (
                      <FactorCell key={f.key} company={c} factorKey={f.key} />
                    ))}
                    <td className="py-space-8 pl-space-12">
                      <div className="flex items-center justify-end gap-space-8">
                        <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface-container xl:block">
                          <span className={`block h-full rounded-full ${tier.bar}`} style={{ width: `${Math.max(2, Math.min(100, score))}%` }} />
                        </span>
                        <span className={`w-8 text-right font-label-mono-md text-label-mono-md font-bold tabular-nums ${tier.text}`}>
                          {score.toFixed(0)}
                        </span>
                        <span
                          className={`hidden w-12 shrink-0 rounded px-space-4 py-space-2 text-center font-label-mono-sm text-label-mono-sm font-bold sm:inline-block ${tier.chip}`}
                        >
                          {tier.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {result.ranked.length === 0 && (
                <tr>
                  <td colSpan={FACTORS.length + 3} className="py-space-24 text-center font-body-sm text-body-sm text-text-muted">
                    Tidak ada emiten yang cocok dengan filter. Turunkan skor minimum atau pilih sub-sektor lain.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {result.ranked.length > BARIS_PER_HALAMAN && (
          <nav className="mt-space-12 flex flex-wrap items-center justify-between gap-space-8" aria-label="Navigasi halaman screener">
            <span className="font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">
              Menampilkan {mulai + 1}&ndash;{Math.min(mulai + BARIS_PER_HALAMAN, result.ranked.length)} dari {result.ranked.length} emiten
            </span>
            <div className="flex items-center gap-space-8">
              <button
                type="button"
                onClick={() => setHalaman((h) => Math.max(0, h - 1))}
                disabled={halamanAman === 0}
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-12 py-space-6 font-body-sm text-body-sm text-text-secondary transition-colors enabled:hover:border-surface-variant disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                Sebelumnya
              </button>
              <span className="font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">
                Halaman {halamanAman + 1} dari {totalHalaman}
              </span>
              <button
                type="button"
                onClick={() => setHalaman((h) => Math.min(totalHalaman - 1, h + 1))}
                disabled={halamanAman >= totalHalaman - 1}
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-12 py-space-6 font-body-sm text-body-sm text-text-secondary transition-colors enabled:hover:border-surface-variant disabled:opacity-30"
              >
                Selanjutnya
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </nav>
        )}

        <div className="mt-space-8 flex flex-wrap items-center justify-between gap-space-8 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
          <span className="flex items-center gap-space-4">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            Angka faktor adalah persentil terhadap {result.groupSize} emiten sub-sektor "{subSector}", bukan nilai absolut. 100 = terbaik di
            kelompoknya.
          </span>
          {result.dataTidakMemadai.length > 0 && (
            <span className="font-label-mono-sm text-label-mono-sm">
              {result.dataTidakMemadai.length} emiten disembunyikan (data tidak memadai)
            </span>
          )}
        </div>
      </>
    )}
  </div>
  );
}
