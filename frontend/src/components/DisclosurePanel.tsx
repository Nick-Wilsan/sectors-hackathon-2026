import { useState } from 'react';

// Panel yang bisa dilipat, dengan kepala yang tetap memberi tahu isinya.
//
// Pola ini sudah dipakai PatternPicker ("Pilih Pola yang Ditandai") dan
// terbukti pas untuk rail analisis: bagian yang jarang disentuh tidak
// menghabiskan tinggi layar, tetapi ringkasannya tetap terbaca tanpa dibuka.
// Diangkat jadi komponen tersendiri supaya Pola Candlestick dan Pengaturan
// Indikator berperilaku sama persis, bukan mirip-mirip.
//
// Ringkasan pada kepala panel bukan hiasan: sebuah panel terlipat yang hanya
// menampilkan judul memaksa pembaca membukanya untuk tahu apakah isinya layak
// dibuka. `summary` menjawab itu lebih dulu.

interface Props {
  title: string;
  icon: string;
  /** Keterangan singkat yang tetap terlihat saat panel tertutup. */
  summary?: React.ReactNode;
  /** Nilai ringkas di ujung kanan kepala, mis. jumlah pola. */
  badge?: React.ReactNode;
  /** Terbuka saat pertama dirender. Bawaannya tertutup. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function DisclosurePanel({ title, icon, summary, badge, defaultOpen = false, children }: Props) {
  const [terbuka, setTerbuka] = useState(defaultOpen);

  return (
    <div className="rounded border border-border-subtle bg-surface-card">
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between gap-space-8 px-space-12 py-space-8 text-left transition-colors hover:bg-surface-container-lowest"
      >
        <span className="flex min-w-0 items-center gap-space-8">
          <span className={`material-symbols-outlined shrink-0 text-[18px] text-primary-container`}>{icon}</span>
          <span className="min-w-0">
            {/* Judul dinyatakan lewat ARIA, bukan elemen <h3>: heading di dalam
                button bukan struktur yang sah. Sama seperti PatternPicker. */}
            <span role="heading" aria-level={3} className="block font-headline-sm text-headline-sm font-bold text-text-primary">
              {title}
            </span>
            {summary && <span className="block font-body-sm text-body-sm text-text-muted">{summary}</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-space-8">
          {badge && <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{badge}</span>}
          <span className="material-symbols-outlined text-[20px] text-text-muted">{terbuka ? 'expand_less' : 'expand_more'}</span>
        </span>
      </button>

      {terbuka && <div className="border-t border-border-subtle px-space-12 py-space-12">{children}</div>}
    </div>
  );
}
