// Wajib tampil di halaman utama dan setiap tampilan yang memuat sinyal
// teknikal/hasil analisis (PRD B-02, ADD-SH2026-003 bagian 6). `sticky
// bottom-0` keeps it on screen while scrolling long pages (detail emiten
// can run several screens tall) — a disclaimer only reachable by scrolling
// all the way down doesn't satisfy "wajib ditampilkan."
export function Disclaimer() {
  return (
    <p className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950 px-4 py-3 text-center text-xs text-neutral-500">
      Produk ini merupakan alat informasi dan analisis, <strong>bukan rekomendasi investasi</strong>.
      Seluruh keputusan investasi merupakan tanggung jawab pengguna.
    </p>
  );
}
