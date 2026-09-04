// Wajib tampil di halaman utama dan setiap tampilan yang memuat sinyal
// teknikal/hasil analisis (PRD B-02, ADD-SH2026-003 bagian 6).
export function Disclaimer() {
  return (
    <p className="border-t border-neutral-800 bg-neutral-950 px-4 py-3 text-center text-xs text-neutral-500">
      Produk ini merupakan alat informasi dan analisis, <strong>bukan rekomendasi investasi</strong>.
      Seluruh keputusan investasi merupakan tanggung jawab pengguna.
    </p>
  );
}
