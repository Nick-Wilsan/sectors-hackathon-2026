// Kamus istilah untuk pengguna — sumber kebenaran tunggal, sinkron dengan
// ADD-SH2026-003 bagian 5. F-05 wajib memakai definisi ini secara konsisten
// (bukan pengetahuan umum model) ketika menjelaskan istilah ke pengguna.
//
// ATURAN PENULISAN DEFINISI, ditetapkan setelah tinjauan 6 September 2026:
// definisi versi pertama menjelaskan jargon memakai jargon lain — "harga saham
// dibanding nilai buku ekuitas per saham" tidak menolong pembaca yang justru
// belum tahu apa itu nilai buku maupun ekuitas. Aturan sekarang:
//
//   1. Tidak boleh memakai istilah keuangan lain yang belum dijelaskan di
//      dalam definisi itu sendiri.
//   2. Pakai perumpamaan sehari-hari bila konsepnya abstrak.
//   3. Sebutkan bagaimana cara membacanya, bukan hanya apa artinya.
//   4. Maksimal tiga kalimat.

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Emiten',
    definition:
      'Perusahaan yang sahamnya bisa dibeli dan dijual di bursa. Saat membeli sahamnya, Anda ikut memiliki sepotong kecil perusahaan itu.',
  },
  {
    term: 'Sektor dan sub-sektor',
    definition:
      'Pengelompokan perusahaan menurut bidang usahanya. Bank dikelompokkan dengan bank, tambang dengan tambang, supaya perbandingannya adil — seperti membandingkan nilai ujian sesama satu kelas, bukan lintas mata pelajaran.',
  },
  {
    term: 'Sub-sektor',
    definition:
      'Kelompok usaha yang lebih rinci daripada sektor. Semua penilaian di produk ini membandingkan sebuah perusahaan hanya dengan sesama anggota sub-sektornya.',
  },
  {
    term: 'Persentil',
    definition:
      'Angka nol sampai seratus yang menunjukkan berapa banyak pesaing yang berada di bawah. Persentil 90 berarti perusahaan ini lebih baik daripada 90 persen pesaingnya pada ukuran tersebut. Ini posisi peringkat, bukan nilai rapor.',
  },
  {
    term: 'Kelompok peer',
    definition: 'Kumpulan perusahaan lain yang bidang usahanya sama, dipakai sebagai pembanding. Semakin banyak anggotanya, semakin bermakna perbandingannya.',
  },
  {
    term: 'Skor Komposit',
    definition:
      'Satu angka nol sampai seratus yang merangkum lima ukuran keuangan sebuah perusahaan sekaligus. Angkanya menyatakan posisi terhadap pesaing di bidang usaha yang sama, bukan penilaian mutlak — dan bukan anjuran membeli.',
  },

  {
    term: 'ROE (Return on Equity)',
    definition:
      'Seberapa besar keuntungan yang dihasilkan dari uang yang ditanam pemilik. Bayangkan membuka warung dengan modal sendiri Rp 100 juta lalu setahun untung Rp 20 juta — ROE-nya 20 persen. Semakin besar, semakin produktif uang pemiliknya bekerja.',
  },
  {
    term: 'ROA (Return on Assets)',
    definition:
      'Seberapa besar keuntungan yang dihasilkan dari seluruh harta yang dikelola perusahaan, termasuk yang dibiayai pinjaman. Bedanya dengan ROE: ROE hanya menghitung uang pemilik, ROA menghitung semuanya.',
  },
  {
    term: 'Margin laba',
    definition:
      'Berapa rupiah yang benar-benar tersisa sebagai untung dari setiap seratus rupiah penjualan, setelah semua biaya dibayar. Warung yang menjual Rp 100 ribu dan menyisakan Rp 10 ribu punya margin 10 persen.',
  },
  {
    term: 'Margin Arus Kas Operasional',
    definition:
      'Berapa bagian dari penjualan yang benar-benar masuk sebagai uang tunai, bukan sekadar tercatat di pembukuan. Penting karena penjualan yang dibayar berutang membuat laporan terlihat untung padahal kasnya kosong.',
  },
  {
    term: 'DER (Debt to Equity Ratio)',
    definition:
      'Perbandingan seluruh kewajiban perusahaan terhadap modal pemiliknya. Pada data Sectors yang dihitung adalah SELURUH kewajiban, bukan hanya pinjaman berbunga. Untuk bank angkanya wajar tinggi karena tabungan nasabah tercatat sebagai kewajiban — itu bahan bakar usahanya, bukan tanda bahaya, sehingga hanya bermakna dibandingkan sesama bank.',
  },
  {
    term: 'Rasio profitabilitas',
    definition: 'Kelompok ukuran yang menjawab satu pertanyaan: seberapa besar untung yang dihasilkan perusahaan dibandingkan sumber daya yang dipakainya.',
  },
  {
    term: 'Rasio utang',
    definition: 'Kelompok ukuran yang menjawab: seberapa besar perusahaan bergantung pada uang pinjaman dibandingkan uang pemiliknya sendiri.',
  },

  {
    term: 'Kapitalisasi Pasar',
    definition:
      'Harga seluruh saham perusahaan bila dijumlahkan pada harga hari ini. Dipakai untuk membandingkan besar-kecilnya perusahaan, bukan untuk menilai mahal atau murahnya saham.',
  },
  {
    term: 'P/E Ratio',
    definition:
      'Berapa kali lipat harga saham dibandingkan keuntungan setahun yang menjadi hak satu lembar saham. Angka 15 kira-kira berarti: dengan tingkat laba sekarang, harga yang dibayar setara lima belas tahun keuntungan. Tidak bisa dihitung jika perusahaannya rugi.',
  },
  {
    term: 'Rata-rata P/E peer',
    definition:
      'Rata-rata P/E seluruh perusahaan di bidang usaha yang sama pada tahun yang sama. Gunanya sebagai pembanding, karena angka P/E sendirian tidak berarti apa-apa.',
  },
  {
    term: 'PBV (Price to Book Value)',
    definition:
      'Perbandingan harga saham terhadap kekayaan bersih perusahaan menurut pembukuannya — yaitu seluruh harta dikurangi seluruh utang, lalu dibagi jumlah saham. Angka 1 berarti harga saham setara nilai kekayaan tercatatnya.',
  },
  {
    term: 'Price to Sales',
    definition:
      'Perbandingan harga saham terhadap penjualan perusahaan per lembar saham. Sering dipakai untuk perusahaan yang belum untung, karena pada kondisi itu P/E tidak bisa dihitung.',
  },
  {
    term: 'PEG Ratio',
    definition:
      'P/E yang dibagi dengan laju pertumbuhan labanya. Maksudnya menempatkan harga dalam konteks: perusahaan yang labanya tumbuh cepat wajar dihargai lebih tinggi daripada yang labanya diam.',
  },
  {
    term: 'Dividend Yield',
    definition:
      'Bagi hasil tunai yang dibagikan perusahaan selama setahun terakhir, dibandingkan harga sahamnya, dinyatakan dalam persen. Tidak semua perusahaan membagikannya — sebagian memilih memakai seluruh labanya untuk tumbuh.',
  },

  {
    term: 'Volume perdagangan',
    definition: 'Jumlah lembar saham yang berpindah tangan pada suatu hari. Volume yang jauh di atas kebiasaan berarti sedang banyak yang menaruh perhatian pada saham itu.',
  },
  {
    term: 'Anomali',
    definition:
      'Kondisi ketika harga atau jumlah saham yang diperdagangkan menyimpang jauh dari kebiasaan perusahaan itu sendiri, dihitung secara statistik. Produk ini hanya menandai bahwa penyimpangan terjadi, tidak menyatakan penyebabnya.',
  },
  {
    term: 'Z-score',
    definition:
      'Ukuran seberapa jauh sebuah angka menyimpang dari kebiasaannya sendiri. Nilai 2 berarti menyimpang dua kali lipat dari sebaran biasanya — cukup jarang terjadi, sehingga dipakai sebagai batas penanda hal yang tidak biasa.',
  },
  {
    term: 'Pola candlestick',
    definition:
      'Bentuk khas pada grafik harga yang sudah dinamai sejak lama oleh para pedagang saham. Produk ini hanya menandai bahwa bentuk itu muncul; keandalannya bervariasi dan bukan ramalan.',
  },
  {
    term: 'Rata-rata bergerak',
    definition:
      'Rata-rata harga selama sejumlah hari terakhir, digambar sebagai garis. Gunanya meredam naik-turun harian supaya arah pergerakan yang lebih besar lebih mudah terlihat.',
  },
  {
    term: 'Indeks Kekuatan Relatif (RSI)',
    definition:
      'Angka nol sampai seratus yang membandingkan seberapa kuat kenaikan harga dibandingkan penurunannya dalam periode tertentu. Ini rangkuman pergerakan yang sudah terjadi, bukan perkiraan pergerakan berikutnya.',
  },
  {
    term: 'CASA',
    definition:
      'Bagian tabungan nasabah bank yang berupa rekening giro dan tabungan biasa. Jenis simpanan ini lebih murah bagi bank dibandingkan deposito, karena bunga yang harus dibayarkannya lebih kecil.',
  },

  {
    term: 'Cost-to-Income Ratio',
    definition:
      'Berapa bagian dari pendapatan bank yang habis untuk biaya operasional seperti gaji, sewa kantor, dan teknologi. Semakin kecil berarti bank itu semakin hemat menjalankan usahanya. Ukuran ini khusus untuk bank.',
  },
  {
    term: 'Framework investasi',
    definition:
      'Daftar periksa penilaian yang sudah diterbitkan dan dipakai luas selama puluhan tahun. Gunanya mengelompokkan perusahaan secara objektif terhadap kriteria baku, bukan menyarankan tindakan.',
  },
  {
    term: 'F-Score Piotroski',
    definition:
      'Daftar periksa sembilan poin yang diterbitkan Joseph Piotroski pada tahun 2000 untuk menilai kesehatan pembukuan perusahaan. Tiap poin bernilai terpenuhi atau tidak, lalu dihitung berapa yang terpenuhi. Produk ini memakai enam poin yang datanya tersedia.',
  },

  // Enam kriteria F-Score, dijelaskan satu per satu. Sebelumnya kriteria hanya
  // tampil sebagai judul bercentang hijau atau silang merah tanpa keterangan
  // apa pun tentang apa yang sedang diperiksa dan mengapa itu penting.
  {
    term: 'Profitabilitas Aset Positif',
    definition:
      'Memeriksa apakah perusahaan menghasilkan untung, bukan rugi, dari harta yang dikelolanya tahun ini. Terpenuhi bila untung. Ini poin paling dasar: perusahaan yang merugi gagal di titik pertama.',
  },
  {
    term: 'Arus Kas Operasional Positif',
    definition:
      'Memeriksa apakah kegiatan usaha sehari-hari benar-benar menghasilkan uang tunai masuk. Terpenuhi bila positif. Perusahaan bisa mencatat laba di pembukuan tetapi tetap kehabisan uang tunai, dan poin ini menangkapnya.',
  },
  {
    term: 'ROA Meningkat dari Tahun Sebelumnya',
    definition:
      'Memeriksa apakah kemampuan menghasilkan untung dari hartanya membaik dibanding tahun lalu. Terpenuhi bila naik. Yang dinilai arah perubahannya, bukan besar angkanya.',
  },
  {
    term: 'Arus Kas Operasional Melebihi Laba Bersih',
    definition:
      'Memeriksa apakah uang tunai yang benar-benar masuk lebih besar daripada laba yang dicatat. Terpenuhi bila lebih besar. Bila laba tercatat jauh melebihi uang yang masuk, labanya masih berupa janji pembayaran, bukan uang.',
  },
  {
    term: 'Rasio Utang terhadap Ekuitas Menurun',
    definition:
      'Memeriksa apakah ketergantungan pada kewajiban berkurang dibanding tahun lalu. Terpenuhi bila menurun. Untuk bank poin ini sering tidak terpenuhi karena tabungan nasabah yang bertambah ikut terhitung sebagai kewajiban.',
  },
  {
    term: 'Perputaran Aset Meningkat',
    definition:
      'Memeriksa apakah perusahaan menghasilkan lebih banyak penjualan dari harta yang sama dibanding tahun lalu. Terpenuhi bila naik. Menunjukkan hartanya dipakai makin efisien.',
  },
];

export function glossaryAsContext(): Record<string, string> {
  return Object.fromEntries(GLOSSARY.map((g) => [g.term, g.definition]));
}
