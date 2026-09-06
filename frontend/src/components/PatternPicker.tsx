import { useMemo, useState } from 'react';
import type { PatternFrequency, PatternCategory } from '../api/types';

// Pemilih pola candlestick (F-07).
//
// Versi sebelumnya hanya punya satu sakelar "Pola" yang menyalakan ke-13 pola
// sekaligus, tanpa cara memilih dan tanpa keterangan apa pun soal seberapa
// sering sebuah pola muncul. Hasilnya penanda bertaburan di grafik yang tidak
// bisa dikendalikan pembaca — hiasan, bukan alat.
//
// Yang berubah bukan hanya kendalinya. Angka frekuensi di sebelah tiap nama
// adalah inti fiturnya: pada pemindaian 1.550 hari bursa, Spinning Top muncul
// pada 44,9% hari dan Doji pada 23,9%, sementara belasan pola termasyhur tidak
// muncul sama sekali. Bentuk yang hadir pada separuh hari perdagangan itu
// menggambarkan hari biasa, bukan pertanda. Pembaca yang melihat angkanya
// sendiri dapat memutuskan mana yang layak ditandai — dan itu pelajaran yang
// jauh lebih berguna daripada menambah seratus nama pola.

const CATEGORY_LABEL: Record<PatternCategory, string> = {
  'reversal-bullish': 'Pembalikan ke atas',
  'reversal-bearish': 'Pembalikan ke bawah',
  continuation: 'Penguasaan satu sisi',
  indecision: 'Keraguan',
};

const CATEGORY_TONE: Record<PatternCategory, string> = {
  'reversal-bullish': 'text-state-positive',
  'reversal-bearish': 'text-state-negative',
  continuation: 'text-primary',
  indecision: 'text-state-warning',
};

/** Di atas ambang ini, sebuah pola muncul terlalu sering untuk disebut kejadian
 *  khusus. Dipakai hanya untuk memberi keterangan, bukan menyembunyikan barisnya. */
const COMMON_RATE = 0.15;

interface Props {
  frequencies: PatternFrequency[];
  barsScanned: number;
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  /** Hanya menandai yang muncul < COMMON_RATE — pintasan menuju yang jarang. */
  onSelectRare: () => void;
}

function Row({ f, checked, onToggle }: { f: PatternFrequency; checked: boolean; onToggle: () => void }) {
  const kosong = f.count === 0;
  const sering = f.rate >= COMMON_RATE;

  return (
    <label
      className={`flex cursor-pointer items-start gap-space-8 rounded border px-space-8 py-space-6 transition-colors ${
        checked ? 'border-primary-container/50 bg-primary-container/5' : 'border-border-subtle/60 bg-surface-container-lowest'
      } ${kosong ? 'opacity-60' : ''} hover:border-surface-variant`}
      title={f.definition}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={kosong}
        className="mt-space-2 h-3 w-3 shrink-0 accent-[var(--color-primary-container)] disabled:opacity-40"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-space-8">
          <span className="truncate font-body-sm text-body-sm font-semibold text-text-primary">{f.label}</span>
          <span className="shrink-0 font-label-mono-sm text-label-mono-sm tabular-nums text-text-secondary">
            {f.count}&times;
          </span>
        </span>

        {/* Batang frekuensi. Skalanya sengaja penuh 0-100% agar 54,8% terlihat
            menenggelamkan 3,2% — itulah perbandingan yang ingin ditunjukkan. */}
        <span className="mt-space-2 flex h-[3px] w-full overflow-hidden rounded-full bg-background-base">
          <span
            className={`h-full rounded-full ${sering ? 'bg-state-warning' : 'bg-primary-container'}`}
            style={{ width: `${Math.max(f.rate * 100, f.count > 0 ? 1.5 : 0)}%` }}
          />
        </span>

        <span className="mt-space-2 block font-label-mono-sm text-label-mono-sm text-text-muted">
          {kosong
            ? 'tidak muncul pada periode ini'
            : `${(f.rate * 100).toFixed(1)}% hari${f.averageGapDays ? ` · rata-rata tiap ${f.averageGapDays.toFixed(0)} hari` : ''}`}
          {sering && ' · terlalu sering untuk disebut khusus'}
        </span>
      </span>
    </label>
  );
}

export function PatternPicker({ frequencies, barsScanned, selected, onToggle, onSelectAll, onClear, onSelectRare }: Props) {
  const [terbuka, setTerbuka] = useState(false);

  const { muncul, tidakMuncul } = useMemo(() => {
    const urut = [...frequencies].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return { muncul: urut.filter((f) => f.count > 0), tidakMuncul: urut.filter((f) => f.count === 0) };
  }, [frequencies]);

  const dipilihMuncul = muncul.filter((f) => selected.has(f.key)).length;

  return (
    <div className="rounded border border-border-subtle bg-surface-card">
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between gap-space-8 px-space-12 py-space-8 text-left transition-colors hover:bg-surface-container-lowest"
      >
        <span className="flex items-center gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">candlestick_chart</span>
          <span>
            {/* Judul di dalam tombol: dinyatakan lewat ARIA, bukan elemen <h3>,
                karena heading di dalam button bukan struktur yang sah. */}
            <span role="heading" aria-level={3} className="block font-headline-sm text-headline-sm font-bold text-text-primary">
              Pilih Pola yang Ditandai
            </span>
            <span className="block font-body-sm text-body-sm text-text-muted">
              {dipilihMuncul} dari {muncul.length} pola yang muncul dipilih &middot; {frequencies.length} pola diperiksa pada{' '}
              {barsScanned} hari bursa
            </span>
          </span>
        </span>
        <span className="material-symbols-outlined shrink-0 text-[20px] text-text-muted">
          {terbuka ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {terbuka && (
        <div className="border-t border-border-subtle px-space-12 py-space-8">
          <div className="flex flex-wrap gap-space-4">
            {[
              { label: 'Pilih semua', act: onSelectAll },
              { label: 'Hanya yang jarang', act: onSelectRare },
              { label: 'Kosongkan', act: onClear },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={b.act}
                className="rounded border border-border-subtle bg-surface-container-lowest px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm text-text-secondary transition-colors hover:border-primary-container hover:text-primary"
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="mt-space-8 grid grid-cols-1 gap-space-4 sm:grid-cols-2 xl:grid-cols-3">
            {muncul.map((f) => (
              <Row key={f.key} f={f} checked={selected.has(f.key)} onToggle={() => onToggle(f.key)} />
            ))}
          </div>

          {tidakMuncul.length > 0 && (
            <>
              <p className="mt-space-12 font-table-header text-table-header uppercase text-text-muted">
                Tidak muncul sama sekali ({tidakMuncul.length})
              </p>
              <div className="mt-space-4 flex flex-wrap gap-space-4">
                {tidakMuncul.map((f) => (
                  <span
                    key={f.key}
                    title={f.definition}
                    className={`rounded border border-border-subtle/60 bg-surface-container-lowest px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm ${CATEGORY_TONE[f.category]} opacity-70`}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </>
          )}

          <p className="mt-space-12 flex items-start gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
            <span className="material-symbols-outlined shrink-0 text-[16px] text-primary">info</span>
            <span>
              Angka di tiap baris adalah berapa kali bentuk itu benar-benar muncul pada emiten ini, bukan seberapa andal ia
              sebagai pertanda. Pola yang muncul pada sebagian besar hari perdagangan menggambarkan hari biasa. Kelompok:{' '}
              {(Object.keys(CATEGORY_LABEL) as PatternCategory[]).map((c, i) => (
                <span key={c}>
                  {i > 0 && ' · '}
                  <span className={CATEGORY_TONE[c]}>{CATEGORY_LABEL[c]}</span>
                </span>
              ))}
              .
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
