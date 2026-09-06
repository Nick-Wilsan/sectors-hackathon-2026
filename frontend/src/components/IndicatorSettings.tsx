import type { IndicatorResult } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';

// Pengaturan periode indikator (F-08).
//
// Sebelumnya MA20, MA50, dan RSI14 dipatok mati di backend, sehingga pembaca
// hanya bisa menyalakan atau mematikannya. Periode adalah satu-satunya angka
// pada indikator ini yang benar-benar pernah ingin diubah orang, dan
// mengubahnya di sini tidak menambah kredit: seri harian yang dihitung ulang
// adalah seri yang sama dan sudah ter-cache.
//
// Sengaja berupa daftar pilihan tetap, bukan kotak angka bebas. Ini periode
// yang lazim dipakai, dan daftar mengajarkan apa yang layak diubah sementara
// kotak kosong hanya mengundang angka asal. Batas atas tiga garis MA supaya
// grafiknya tetap terbaca.
const MAX_MA_LINES = 3;

interface Props {
  indicators: IndicatorResult;
  maPeriods: number[];
  rsiPeriod: number;
  onMaPeriodsChange: (periods: number[]) => void;
  onRsiPeriodChange: (period: number) => void;
  showMA: boolean;
  showRsi: boolean;
}

function Chip({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`rounded border px-space-8 py-space-2 font-label-mono-sm text-label-mono-sm tabular-nums transition-colors ${
        active
          ? 'border-primary-container bg-primary-container/10 font-bold text-primary'
          : 'border-border-subtle bg-surface-container-lowest text-text-secondary hover:border-surface-variant hover:text-text-primary'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function IndicatorSettings({
  indicators,
  maPeriods,
  rsiPeriod,
  onMaPeriodsChange,
  onRsiPeriodChange,
  showMA,
  showRsi,
}: Props) {
  const { maPeriodChoices, rsiPeriodChoices, barsAvailable } = indicators;

  function toggleMa(period: number) {
    const next = maPeriods.includes(period) ? maPeriods.filter((p) => p !== period) : [...maPeriods, period];
    // Menolak daftar kosong: mematikan MA dilakukan lewat sakelar di toolbar,
    // bukan dengan melepas centang terakhir, yang akan terasa seperti rusak.
    if (next.length === 0 || next.length > MAX_MA_LINES) return;
    onMaPeriodsChange(next.sort((a, b) => a - b));
  }

  // Periode yang melebihi jumlah bar tidak akan menghasilkan satu titik pun.
  // Tombolnya dimatikan dengan keterangan, bukan dibiarkan menggambar garis
  // kosong yang terlihat seperti bug.
  const terlaluPanjang = (period: number) => period > barsAvailable;

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-12">
      <div className="flex items-center gap-space-8 border-b border-border-subtle pb-space-8">
        <span className="material-symbols-outlined text-[18px] text-primary-container">tune</span>
        <div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Pengaturan Indikator</h3>
          <p className="font-body-sm text-body-sm text-text-muted">
            Ubah jumlah hari yang dipakai tiap indikator. Tidak menambah pemakaian data.
          </p>
        </div>
      </div>

      <div className="mt-space-12 flex flex-col gap-space-12">
        <div className={showMA ? '' : 'opacity-60'}>
          <div className="flex flex-wrap items-baseline justify-between gap-space-8">
            <span className="font-body-sm text-body-sm font-semibold text-text-primary">
              <GlossaryTerm term="Rata-rata bergerak">Rata-rata bergerak (MA)</GlossaryTerm>
            </span>
            <span className="font-label-mono-sm text-label-mono-sm text-text-muted">
              {showMA ? `${maPeriods.length} garis aktif` : 'Nyalakan "MA" di toolbar untuk menampilkan'}
            </span>
          </div>
          <div className="mt-space-6 flex flex-wrap gap-space-4">
            {maPeriodChoices.map((p) => (
              <Chip
                key={p}
                active={maPeriods.includes(p)}
                disabled={terlaluPanjang(p)}
                onClick={() => toggleMa(p)}
                title={terlaluPanjang(p) ? `Butuh ${p} hari data, tersedia ${barsAvailable}` : `Rata-rata ${p} hari`}
              >
                MA{p}
              </Chip>
            ))}
          </div>
          <p className="mt-space-4 font-label-mono-sm text-label-mono-sm text-text-muted">
            Maksimal {MAX_MA_LINES} garis. Periode yang melebihi {barsAvailable} hari riwayat tidak dapat dipilih.
          </p>
        </div>

        <div className={showRsi ? '' : 'opacity-60'}>
          <div className="flex flex-wrap items-baseline justify-between gap-space-8">
            <span className="font-body-sm text-body-sm font-semibold text-text-primary">
              <GlossaryTerm term="Indeks Kekuatan Relatif (RSI)">Indeks Kekuatan Relatif (RSI)</GlossaryTerm>
            </span>
            <span className="font-label-mono-sm text-label-mono-sm text-text-muted">
              {showRsi ? `${rsiPeriod} hari` : 'Nyalakan "RSI" di toolbar untuk menampilkan'}
            </span>
          </div>
          <div className="mt-space-6 flex flex-wrap gap-space-4">
            {rsiPeriodChoices.map((p) => (
              <Chip
                key={p}
                active={rsiPeriod === p}
                disabled={terlaluPanjang(p + 1)}
                onClick={() => onRsiPeriodChange(p)}
                title={`RSI ${p} hari`}
              >
                RSI{p}
              </Chip>
            ))}
          </div>
          <p className="mt-space-4 font-label-mono-sm text-label-mono-sm text-text-muted">
            Periode lebih pendek membuat RSI lebih sering menyentuh batas 30 dan 70; lebih panjang membuatnya lebih tenang.
          </p>
        </div>
      </div>
    </div>
  );
}
