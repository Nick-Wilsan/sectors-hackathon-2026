import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getGlosarium } from '../api/client';

// Tooltip glosarium (roadmap task 31).
//
// Produk ini menargetkan investor pemula, tetapi antarmukanya padat istilah
// teknis. Setiap istilah yang dibungkus komponen ini mendapat garis bawah titik
// dan penjelasan berbahasa awam saat disorot atau difokus keyboard.
//
// Definisinya diambil dari backend/src/ai/glossary.ts lewat /api/market/glosarium
// — berkas yang sama yang menjadi konteks lapisan AI, sehingga tooltip dan
// jawaban asisten tidak pernah memberi definisi yang berbeda. Tidak memanggil
// Sectors, jadi 0 kredit.
//
// Panelnya diposisikan `fixed` terhadap layar, bukan `absolute` terhadap
// pembungkusnya. Versi absolute terpotong setiap kali istilahnya berada di
// dalam tabel bergulir mendatar atau di tepi kartu — dan itu terjadi pada
// tabel multiples serta laporan keuangan, dua tempat yang justru paling
// membutuhkan penjelasan.

let cache: Promise<Record<string, string>> | null = null;

/** Diambil sekali per sesi, dipakai bersama semua tooltip di halaman. */
function loadGlossary(): Promise<Record<string, string>> {
  if (!cache) {
    cache = getGlosarium()
      .then((r) => Object.fromEntries(r.terms.map((t) => [t.term.toLowerCase(), t.definition])))
      .catch(() => ({}));
  }
  return cache;
}

const LEBAR_PANEL = 288;
const JARAK = 8;

interface GlossaryTermProps {
  /** Kunci pencarian di kamus. Boleh berbeda dari teks yang tampil. */
  term: string;
  children: React.ReactNode;
  className?: string;
  /** Sisa dari versi lama; arah kini ditentukan otomatis dari ruang yang ada. */
  below?: boolean;
}

export function GlossaryTerm({ term, children, className = '' }: GlossaryTermProps) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const pemicuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let batal = false;
    void loadGlossary().then((map) => {
      if (batal) return;
      const key = term.toLowerCase();
      // Cocokkan persis dulu, lalu sebagian — supaya "DER" menemukan
      // "DER (Debt to Equity Ratio)" tanpa perlu menulis judul lengkapnya.
      const hit = map[key] ?? Object.entries(map).find(([k]) => k.startsWith(key) || k.includes(key))?.[1];
      setDefinition(hit ?? null);
    });
    return () => {
      batal = true;
    };
  }, [term]);

  /** Menempatkan panel: di atas pemicu bila muat, kalau tidak di bawahnya,
   *  lalu ditahan agar tidak keluar tepi layar mana pun.
   *
   *  `tinggi` diisi hasil pengukuran panel yang sudah ter-render. Versi
   *  pertama memakai tebakan 132 piksel, padahal definisi yang panjang
   *  menghasilkan panel setinggi 161 piksel — cukup untuk menembus tepi atas
   *  layar ketika istilahnya berada di bagian atas halaman. */
  const hitungPosisi = useCallback((tinggi = 132) => {
    const el = pemicuRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const muatDiAtas = r.top - JARAK - tinggi >= JARAK;
    const atas = muatDiAtas ? r.top - JARAK - tinggi : r.bottom + JARAK;
    const top = Math.min(Math.max(JARAK, atas), Math.max(JARAK, window.innerHeight - tinggi - JARAK));
    const left = Math.min(Math.max(JARAK, r.left), Math.max(JARAK, window.innerWidth - LEBAR_PANEL - JARAK));
    setPos({ top, left });
  }, []);

  const panelRef = useRef<HTMLSpanElement>(null);

  const buka = useCallback(() => {
    hitungPosisi();
    setOpen(true);
  }, [hitungPosisi]);

  // Posisi dikoreksi sekali setelah panel ada di DOM, memakai tingginya yang
  // sebenarnya alih-alih tebakan.
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    hitungPosisi(panelRef.current.getBoundingClientRect().height);
    // hitungPosisi stabil; `open` saja yang memicu pengukuran ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Panel `fixed` tidak ikut bergerak saat halaman digulir, jadi ia ditutup
  // begitu pengguna menggulir — lebih jujur daripada penjelasan yang melayang
  // jauh dari istilah yang dijelaskannya.
  useEffect(() => {
    if (!open) return;
    const tutup = () => setOpen(false);
    window.addEventListener('scroll', tutup, true);
    window.addEventListener('resize', tutup);
    return () => {
      window.removeEventListener('scroll', tutup, true);
      window.removeEventListener('resize', tutup);
    };
  }, [open]);

  // Istilah tanpa definisi tampil sebagai teks biasa — tidak ada pemicu mati.
  if (!definition) return <span className={className}>{children}</span>;

  return (
    <span className={`inline-flex items-center ${className}`} onMouseEnter={buka} onMouseLeave={() => setOpen(false)}>
      <button
        ref={pemicuRef}
        type="button"
        aria-label={`Penjelasan istilah ${term}`}
        aria-expanded={open}
        onFocus={buka}
        onBlur={() => setOpen(false)}
        onClick={() => (open ? setOpen(false) : buka())}
        className="cursor-help border-b border-dotted border-text-muted text-left decoration-dotted underline-offset-4 transition-colors hover:border-primary hover:text-primary focus:border-primary focus:text-primary focus:outline-none"
      >
        {children}
      </button>

      {open && pos && (
        <span
          ref={panelRef}
          role="tooltip"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: LEBAR_PANEL }}
          // Panel ini bisa muncul dari dalam header tabel, sel angka, atau
          // judul beruppercase — dan properti teks di sana diwariskan ke sini.
          // `whitespace-normal` yang paling menentukan: header screener memakai
          // `whitespace-nowrap`, sehingga tanpa penyetelan ulang ini kalimat
          // penjelasan menolak membungkus dan terpotong di tepi panel.
          className="z-50 whitespace-normal break-words rounded-lg border border-surface-variant bg-surface-container p-space-12 text-left normal-case tracking-normal shadow-[var(--shadow-popover)]"
        >
          <span className="block font-label-mono-sm text-label-mono-sm uppercase text-primary">{term}</span>
          <span className="mt-space-4 block font-body-sm text-body-sm leading-relaxed text-text-secondary">{definition}</span>
        </span>
      )}
    </span>
  );
}
