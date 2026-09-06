import { useEffect, useState } from 'react';
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

interface GlossaryTermProps {
  /** Kunci pencarian di kamus. Boleh berbeda dari teks yang tampil. */
  term: string;
  children: React.ReactNode;
  className?: string;
  /** Buka ke bawah, untuk pemicu yang berada di tepi atas seperti header tabel. */
  below?: boolean;
}

export function GlossaryTerm({ term, children, className = '', below = false }: GlossaryTermProps) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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

  // Istilah tanpa definisi tampil sebagai teks biasa — tidak ada pemicu mati.
  if (!definition) return <span className={className}>{children}</span>;

  return (
    <span
      className={`relative inline-flex items-center gap-space-2 ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`Penjelasan istilah ${term}`}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help border-b border-dotted border-text-muted text-left decoration-dotted underline-offset-4 transition-colors hover:border-primary hover:text-primary focus:border-primary focus:text-primary focus:outline-none"
      >
        {children}
      </button>

      {open && (
        <span
          role="tooltip"
          className={
            below
              ? 'absolute top-full right-0 z-50 mt-space-6 w-64 rounded-lg border border-surface-variant bg-surface-container p-space-12 text-left normal-case shadow-[0_12px_32px_rgba(0,0,0,0.65)]'
              : 'absolute bottom-full left-0 z-50 mb-space-6 w-64 rounded-lg border border-surface-variant bg-surface-container p-space-12 text-left normal-case shadow-[0_12px_32px_rgba(0,0,0,0.65)]'
          }
        >
          <span className="block font-label-mono-sm text-label-mono-sm uppercase text-primary">{term}</span>
          <span className="mt-space-4 block font-body-sm text-body-sm leading-relaxed text-text-secondary">{definition}</span>
        </span>
      )}
    </span>
  );
}
