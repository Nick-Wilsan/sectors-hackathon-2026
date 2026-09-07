// Perpindahan antar-bagian di dalam satu halaman.
//
// Ditulis untuk menggantikan tautan `href="#id"` biasa, yang menimbulkan dua
// masalah nyata:
//
//   1. Hash tertinggal di URL. Setelah menekan "Berita", alamatnya menjadi
//      .../emiten/BBCA#berita-emiten. Menggulir kembali ke atas lalu me-refresh
//      membuat peramban melompat lagi ke jangkar itu — dan karena panel di
//      bawahnya masih dimuat saat lompatan terjadi, tinggi halaman berubah
//      setelahnya sehingga pembaca mendarat di bagian yang salah, bukan di
//      tempat ia terakhir berada.
//   2. Pada layar lebar, bagian seperti Komponen Skor berada di kolom kanan
//      yang sejajar dengan grafik. Menggulirnya ke atas layar tidak memberi
//      tahu apa pun tentang bagian MANA yang dimaksud, karena yang paling
//      mencolok justru grafik di sebelah kirinya.
//
// Karena itu fungsi ini menggulir tanpa menyentuh URL, lalu menyalakan sorotan
// sekejap pada bagian tujuan supaya mata pembaca tahu harus jatuh ke mana.

/** Tinggi header tetap ditambah pita daftar isi yang menempel di bawahnya. */
const OFFSET_ATAS = 104;

const KELAS_SOROT = ['ring-2', 'ring-primary-container', 'ring-offset-2', 'ring-offset-background-base', 'rounded'];

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;

  const y = el.getBoundingClientRect().top + window.scrollY - OFFSET_ATAS;
  // 'auto', bukan 'smooth': animasi smooth digerakkan requestAnimationFrame
  // dan berhenti saat tab tidak digambar, sehingga lompatannya bisa diam-diam
  // gagal — alasan yang sama sudah dicatat pada useHashScroll di App.tsx.
  window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });

  el.classList.add(...KELAS_SOROT);
  window.setTimeout(() => el.classList.remove(...KELAS_SOROT), 1400);
}
