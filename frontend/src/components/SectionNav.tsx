import { useEffect, useState } from 'react';
import { scrollToSection } from '../lib/scrollToSection';

// Penunjuk isi halaman emiten, menempel di bawah header.
//
// Uji pengguna 7 September 2026: kedua responden mengira halaman emiten
// berakhir di grafik. Kartu identitas ditambah grafik setinggi 480 piksel
// memenuhi hampir seluruh layar, dan tidak ada apa pun di tepi bawahnya yang
// menandakan masih ada dua belas panel lagi di bawah — persis gejala "false
// bottom" yang klasik. Keduanya baru menggulir setelah diberi tahu.
//
// Daftar ini menyelesaikan dua hal sekaligus: ia MENYATAKAN bahwa halaman
// masih berlanjut, dan memberi jalan pintas ke bagian yang dicari tanpa harus
// menggulir melewati semuanya.

export interface SectionLink {
  id: string;
  label: string;
}

export function SectionNav({ sections }: { sections: SectionLink[] }) {
  const [aktif, setAktif] = useState<string | null>(sections[0]?.id ?? null);

  // Bagian yang sedang dibaca ditentukan dari bagian teratas yang masih
  // terlihat. Ambang atasnya digeser turun 96 piksel supaya header dan pita
  // ini sendiri tidak dihitung sebagai penutup bagian berikutnya.
  useEffect(() => {
    const elemen = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    if (elemen.length === 0) return;

    const pengamat = new IntersectionObserver(
      (entries) => {
        const terlihat = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (terlihat[0]) setAktif(terlihat[0].target.id);
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    );
    elemen.forEach((el) => pengamat.observe(el));
    return () => pengamat.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Bagian halaman emiten"
      className="sticky top-nav-height z-40 -mx-space-16 border-b border-border-subtle bg-background-base/95 px-space-16 backdrop-blur"
    >
      <div className="flex items-center gap-space-8 overflow-x-auto py-space-8">
        <span className="hidden shrink-0 items-center gap-space-4 font-table-header text-table-header uppercase text-text-muted sm:flex">
          <span className="material-symbols-outlined text-[16px]">list</span>
          Isi halaman
        </span>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            // href dipertahankan supaya tautan tetap dapat difokus keyboard dan
            // dibuka di tab baru, tetapi klik biasa ditangani sendiri agar hash
            // tidak tertinggal di URL — lihat catatan di scrollToSection.
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              scrollToSection(s.id);
            }}
            aria-current={aktif === s.id ? 'true' : undefined}
            className={
              aktif === s.id
                ? 'shrink-0 rounded border border-primary-container bg-surface-container px-space-8 py-space-4 font-body-sm text-body-sm font-semibold whitespace-nowrap text-primary'
                : 'shrink-0 rounded border border-border-subtle px-space-8 py-space-4 font-body-sm text-body-sm whitespace-nowrap text-text-muted transition-colors hover:border-surface-variant hover:text-text-primary'
            }
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
