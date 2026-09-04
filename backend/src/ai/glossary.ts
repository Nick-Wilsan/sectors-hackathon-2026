// Kamus istilah untuk pengguna — sumber kebenaran tunggal, sinkron dengan
// ADD-SH2026-003 bagian 5. F-05 wajib memakai definisi ini secara konsisten
// (bukan pengetahuan umum model) ketika menjelaskan istilah ke pengguna.

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Emiten', definition: 'Perusahaan yang sahamnya diperdagangkan di bursa.' },
  {
    term: 'Sektor dan sub-sektor',
    definition: 'Pengelompokan perusahaan berdasarkan bidang usaha, dipakai untuk menentukan pembanding yang setara.',
  },
  {
    term: 'Rasio profitabilitas',
    definition: 'Ukuran seberapa besar keuntungan yang dihasilkan perusahaan dibandingkan sumber daya yang digunakannya.',
  },
  {
    term: 'Rasio utang',
    definition: 'Ukuran seberapa besar perusahaan bergantung pada pinjaman dibandingkan modal sendiri.',
  },
  {
    term: 'Persentil',
    definition: 'Posisi suatu nilai apabila seluruh pembanding diurutkan, dinyatakan dalam angka nol sampai seratus.',
  },
  { term: 'Volume perdagangan', definition: 'Jumlah saham yang diperjualbelikan pada suatu periode.' },
  {
    term: 'Pola candlestick',
    definition: 'Bentuk grafik harga yang dikenali dan diberi nama dalam analisis teknikal, dengan keandalan yang bervariasi.',
  },
  {
    term: 'Rata-rata bergerak',
    definition: 'Rata-rata harga pada sejumlah periode terakhir, dipakai untuk melihat arah pergerakan secara lebih halus.',
  },
  {
    term: 'ROE (Return on Equity)',
    definition:
      'Persentase yang menunjukkan seberapa besar laba yang dihasilkan perusahaan dibandingkan modal yang disetor pemegang saham.',
  },
  {
    term: 'DER (Debt to Equity Ratio)',
    definition: 'Rasio utang dibandingkan modal sendiri. Angka di atas satu berarti perusahaan lebih banyak dibiayai utang daripada modal sendiri.',
  },
  {
    term: 'Margin laba',
    definition: 'Persentase laba yang tersisa dari setiap seratus rupiah penjualan setelah dikurangi biaya.',
  },
  {
    term: 'Skor Komposit',
    definition: 'Angka gabungan dari nol sampai seratus yang meringkas beberapa rasio fundamental sebuah emiten menjadi satu nilai.',
  },
  {
    term: 'Kelompok peer',
    definition: 'Kumpulan emiten lain pada sub-sektor yang sama, dipakai sebagai pembanding.',
  },
  {
    term: 'Anomali',
    definition: 'Kondisi ketika harga atau volume perdagangan suatu emiten menyimpang cukup jauh dari kebiasaan historisnya, dihitung secara statistik.',
  },
  {
    term: 'Indeks Kekuatan Relatif (RSI)',
    definition: 'Indikator teknikal yang menunjukkan seberapa kuat kenaikan harga dibandingkan penurunan harga dalam periode tertentu.',
  },
  {
    term: 'Framework investasi',
    definition:
      'Kumpulan kriteria penilaian klasik dan telah dipublikasikan luas yang dipakai untuk mengklasifikasikan emiten secara objektif, bukan untuk menyarankan tindakan.',
  },
];

export function glossaryAsContext(): Record<string, string> {
  return Object.fromEntries(GLOSSARY.map((g) => [g.term, g.definition]));
}
