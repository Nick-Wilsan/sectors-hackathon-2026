// Wajib tampil di halaman utama dan setiap tampilan yang memuat sinyal
// teknikal/hasil analisis (PRD B-02, ADD-SH2026-003 bagian 6). `sticky
// bottom-0` keeps the disclaimer on screen while scrolling long pages.
//
// The explicit z-index matters: a sticky element with `z-index: auto` does
// not create a stacking context, so the chart canvases painted through the
// disclaimer bar and left the text sitting on top of live candles.
export function Footer() {
  return (
    <footer className="sticky bottom-0 z-40 border-t border-border-subtle bg-background-base px-space-16 py-space-8 text-center">
      <p className="font-body-sm text-body-sm text-text-secondary">
        Produk ini merupakan alat informasi dan analisis, <strong className="text-text-primary">bukan rekomendasi investasi</strong>.
        Keputusan investasi merupakan tanggung jawab pengguna.
      </p>
      <p className="mt-space-2 font-label-mono-sm text-label-mono-sm text-text-muted">
        Data pasar bersumber dari{' '}
        <a href="https://sectors.app" target="_blank" rel="noreferrer" className="text-text-secondary transition-colors hover:text-primary">
          Sectors
        </a>
        {' · '}
        Dibuat oleh Nick Wilsan &middot;{' '}
        <a
          href="https://github.com/Nick-Wilsan/sectors-hackathon-2026"
          target="_blank"
          rel="noreferrer"
          className="text-text-secondary transition-colors hover:text-primary"
        >
          Repositori
        </a>
      </p>
    </footer>
  );
}
