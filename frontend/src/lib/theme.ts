import { useCallback, useEffect, useState } from 'react';

// Pemilihan tema terang/gelap.
//
// Nilai tema ditulis sebagai atribut data-theme pada elemen <html>, dan seluruh
// perubahan warna terjadi lewat definisi ulang token di index.css. Tidak ada
// satu pun komponen yang perlu tahu tema apa yang sedang aktif.
//
// Urutan penentuan: pilihan tersimpan pengguna, lalu preferensi sistem, lalu
// gelap sebagai bawaan. Gelap tetap menjadi bawaan karena identitas visual
// produk ini adalah terminal gelap; terang disediakan sebagai pilihan.

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'stocket-theme';

function bacaTemaTersimpan(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    // Mode penyamaran atau penyimpanan diblokir — bukan alasan untuk gagal.
    return null;
  }
}

function temaSistem(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function temaAwal(): Theme {
  return bacaTemaTersimpan() ?? temaSistem();
}

/** Menuliskan tema ke <html>. Dipanggil sedini mungkin agar tidak ada kedipan. */
export function terapkanTema(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(temaAwal);

  useEffect(() => {
    terapkanTema(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Pilihan tetap berlaku untuk sesi ini walau tidak bisa disimpan.
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle };
}

/**
 * Membaca nilai token warna yang sedang berlaku dari CSS.
 * Dipakai komponen grafik, yang menerima warna sebagai nilai JavaScript dan
 * tidak bisa memakai kelas utilitas — dengan ini pun ikut berubah saat tema
 * berganti, tanpa daftar warna kedua yang harus dijaga tetap sinkron.
 */
export function tokenWarna(nama: string, cadangan: string): string {
  if (typeof document === 'undefined') return cadangan;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-${nama}`).trim();
  return v || cadangan;
}

/**
 * Tema yang sedang aktif, dibaca dari atribut <html> dan diperbarui saat
 * atributnya berubah. Dipakai komponen yang menerima warna sebagai nilai
 * JavaScript — grafik — agar bisa menyesuaikan tanpa menerima prop dari
 * seluruh rantai induknya.
 */
export function useTemaAktif(): Theme {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === 'undefined' ? 'dark' : ((document.documentElement.dataset.theme as Theme | undefined) ?? 'dark'),
  );

  useEffect(() => {
    const el = document.documentElement;
    const pengamat = new MutationObserver(() => {
      setTheme((el.dataset.theme as Theme | undefined) ?? 'dark');
    });
    pengamat.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => pengamat.disconnect();
  }, []);

  return theme;
}
