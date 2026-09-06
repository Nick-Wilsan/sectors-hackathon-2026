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
    // Diverifikasi 5 Sep 2026 dari laporan keuangan mentah: nilai
    // debt_to_equity_ratio milik Sectors sama dengan total_liabilities /
    // total_equity, BUKAN total_debt / total_equity (BBCA 4,63 versus 0,0085).
    // Definisi lama menyebut "utang" saja dan menyesatkan untuk bank, yang
    // liabilitasnya sebagian besar berupa simpanan nasabah.
    term: 'DER (Debt to Equity Ratio)',
    definition:
      'Perbandingan seluruh kewajiban perusahaan terhadap modal sendiri. Pada data Sectors, pembilangnya adalah total liabilitas, bukan utang berbunga saja. Untuk bank, angka ini wajar tinggi karena simpanan nasabah dihitung sebagai kewajiban, sehingga hanya bermakna bila dibandingkan sesama emiten satu sub-sektor.',
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
  {
    term: 'Margin Arus Kas Operasional',
    definition: 'Bagian dari pendapatan yang benar-benar menjadi kas dari kegiatan usaha sehari-hari, sebelum belanja modal dan pendanaan.',
  },
  {
    term: 'ROA (Return on Assets)',
    definition: 'Persentase laba yang dihasilkan dibandingkan seluruh aset yang dikelola perusahaan.',
  },
  {
    term: 'Sub-sektor',
    definition: 'Pengelompokan emiten yang lebih rinci daripada sektor, dipakai sebagai kelompok pembanding saat menghitung persentil.',
  },
  {
    term: 'Kapitalisasi Pasar',
    definition:
      'Nilai seluruh saham perusahaan bila dihitung pada harga saat ini, yaitu harga per saham dikali jumlah saham beredar. Dipakai untuk membandingkan ukuran perusahaan, bukan untuk menilai harganya.',
  },
  {
    term: 'P/E Ratio',
    definition:
      'Harga satu saham dibanding laba bersih per saham. Angka 15 berarti harga saham setara lima belas kali laba setahun. Hanya bermakna bila dibandingkan dengan emiten sejenis, dan tidak dapat dihitung ketika perusahaan merugi.',
  },
  {
    term: 'Rata-rata P/E peer',
    definition:
      'Rata-rata P/E seluruh emiten pada sub-sektor yang sama untuk tahun buku yang sama. Menjadi pembanding agar P/E sebuah emiten tidak dibaca sendirian tanpa konteks.',
  },
  {
    term: 'PBV (Price to Book Value)',
    definition:
      'Harga satu saham dibanding nilai buku ekuitas per saham, yaitu kekayaan bersih perusahaan menurut catatan akuntansinya. Angka 1 berarti harga saham setara nilai bukunya.',
  },
  {
    term: 'Price to Sales',
    definition: 'Harga satu saham dibanding pendapatan per saham. Dipakai ketika perusahaan belum membukukan laba sehingga P/E tidak dapat dihitung.',
  },
  {
    term: 'PEG Ratio',
    definition: 'P/E dibagi laju pertumbuhan laba. Menempatkan P/E dalam konteks seberapa cepat laba perusahaan bertumbuh.',
  },
  {
    term: 'Dividend Yield',
    definition:
      'Dividen yang dibagikan selama dua belas bulan terakhir dibanding harga saham saat ini, dinyatakan dalam persen. Tidak semua emiten membagikan dividen.',
  },
  {
    term: 'F-Score Piotroski',
    definition:
      'Daftar periksa akuntansi yang dipublikasikan Joseph Piotroski pada tahun 2000. Setiap kriteria bernilai terpenuhi atau tidak terpenuhi, lalu dihitung berapa yang terpenuhi. Hasilnya klasifikasi terhadap kriteria yang sudah baku, bukan anjuran tindakan.',
  },
  {
    term: 'Z-score',
    definition:
      'Ukuran seberapa jauh sebuah angka menyimpang dari kebiasaannya sendiri, dihitung dalam satuan simpangan baku. Nilai dua berarti menyimpang dua kali lipat dari sebaran normalnya, yang dipakai sebagai ambang penanda anomali.',
  },
  {
    term: 'CASA',
    definition:
      'Bagian simpanan nasabah bank yang berupa giro dan tabungan, dibanding seluruh simpanan. Simpanan jenis ini berbiaya bunga lebih rendah bagi bank dibanding deposito berjangka.',
  },
];

export function glossaryAsContext(): Record<string, string> {
  return Object.fromEntries(GLOSSARY.map((g) => [g.term, g.definition]));
}
