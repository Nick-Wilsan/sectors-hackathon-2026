// Tanda asisten AI Stocket.
//
// Menggantikan ikon `smart_toy` bawaan Material, yang menggambarkan robot —
// citra yang justru salah untuk produk ini: lapisan AI di sini tidak berpikir
// sendiri, ia hanya menjelaskan angka yang sudah dihitung lapisan analisis.
//
// Bentuknya menuruti disiplin yang sama dengan Wordmark: tanpa maskot, tanpa
// ilustrasi — hanya primitif geometris. Batang aksen pada wordmark diulang
// tiga kali menaik (badan lilin/ticker), lalu satu percik sebagai isyarat
// "dijelaskan". Mewarisi `currentColor` agar mengikuti tema tanpa penyesuaian.
export function StocketAiMark({ className = '', size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="3.2" y="14" width="3.2" height="7" rx="1.4" fill="currentColor" opacity="0.55" />
      <rect x="8.6" y="10.5" width="3.2" height="10.5" rx="1.4" fill="currentColor" opacity="0.78" />
      <rect x="14" y="7" width="3.2" height="14" rx="1.4" fill="currentColor" />
      <path
        d="M20 0.4C20.4 2.6 21 3.2 23.2 3.6C21 4 20.4 4.6 20 6.8C19.6 4.6 19 4 16.8 3.6C19 3.2 19.6 2.6 20 0.4Z"
        fill="currentColor"
      />
    </svg>
  );
}
