// Wajib tampil di halaman utama dan setiap tampilan yang memuat sinyal
// teknikal/hasil analisis (PRD B-02, ADD-SH2026-003 bagian 6). `sticky
// bottom-0` keeps the disclaimer on screen while scrolling long pages.
export function Footer() {
  return (
    <footer className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950 px-4 py-2.5 text-center sm:px-6">
      <p className="text-xs text-neutral-500">
        Produk ini merupakan alat informasi dan analisis, <strong className="text-neutral-400">bukan rekomendasi investasi</strong>.
        Keputusan investasi merupakan tanggung jawab pengguna.
      </p>
      <p className="mt-1 text-[11px] text-neutral-600">
        Data pasar bersumber dari{' '}
        <a href="https://sectors.app" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-brand">
          Sectors
        </a>
        {' · '}
        Dibuat oleh Nick Wilsan &middot;{' '}
        <a
          href="https://github.com/Nick-Wilsan/sectors-hackathon-2026"
          target="_blank"
          rel="noreferrer"
          className="text-neutral-500 hover:text-brand"
        >
          Repositori
        </a>
      </p>
    </footer>
  );
}
