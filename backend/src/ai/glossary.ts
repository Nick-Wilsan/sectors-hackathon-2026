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
    // Ditulis ulang setelah uji pengguna 7 September 2026. Versi lama berbunyi
    // "merangkum lima ukuran keuangan sekaligus ... posisi terhadap pesaing,
    // bukan penilaian mutlak" — kedua responden harus membacanya berulang kali
    // dan tetap tidak menangkap maksudnya, karena kalimatnya menuntut pembaca
    // memegang dua konsep abstrak sekaligus tanpa satu pun contoh angka.
    // Versi ini memberi contoh lebih dulu, lalu menutup salah paham yang
    // benar-benar muncul di uji: skor tinggi dikira berarti sahamnya murah.
    term: 'Skor Komposit',
    definition:
      'Nilai nol sampai seratus yang menunjukkan posisi sebuah perusahaan di antara pesaing sebidangnya. Skor 78 berarti keuangannya lebih baik daripada sekitar 78 dari tiap 100 pesaingnya. Harga sahamnya sama sekali tidak ikut dihitung, jadi skor tinggi tidak berarti sahamnya sedang murah.',
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
    term: 'IHSG',
    definition:
      'Angka rata-rata yang merangkum pergerakan seluruh saham di Bursa Efek Indonesia dalam satu bilangan. Kalau IHSG naik, artinya secara umum lebih banyak saham yang naik daripada yang turun hari itu. Dipakai sebagai pembanding untuk melihat apakah satu saham bergerak sendirian atau ikut arus pasar.',
  },
  {
    term: 'Selisih terhadap IHSG',
    definition:
      'Selisih antara pergerakan satu saham hari itu dengan pergerakan pasar secara keseluruhan. Kalau saham naik 5% sementara pasar naik 4%, selisihnya hanya 1 poin persen — berarti kenaikannya sebagian besar karena seluruh bursa sedang naik, bukan karena sesuatu yang khusus pada perusahaan itu. Angka ini hanya memisahkan gerakan pasar dari gerakan khas emiten; ia tidak menjelaskan apa yang terjadi.',
  },
  {
    term: 'Sensitivitas terhadap IHSG',
    definition:
      'Rata-rata seberapa besar saham ini bergerak setiap kali pasar bergerak 1%, dihitung dari 90 hari terakhir. Nilai 1,5 berarti saham ini biasanya bergerak satu setengah kali lebih heboh daripada pasar, ke atas maupun ke bawah. Nilai di bawah 1 berarti geraknya lebih tenang daripada pasar.',
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

  // ---------------------------------------------------------------------
  // Pos laporan keuangan.
  //
  // PRD menetapkan "seluruh istilah teknis di antarmuka memiliki penjelasan"
  // sebagai metrik keberhasilan yang dinilai juri, tetapi panel Laporan
  // Keuangan menampilkan tiga puluh empat nama pos dan hanya tujuh di
  // antaranya punya tooltip — sisanya bahkan meminjam definisi rasio yang
  // hanya bersinggungan, sehingga "Pendapatan" menampilkan penjelasan tentang
  // margin laba. Bagian ini menutup celah itu: satu definisi per pos, memakai
  // aturan penulisan yang sama seperti di atas.
  // ---------------------------------------------------------------------
  {
    term: 'Pendapatan',
    definition:
      'Seluruh uang yang masuk dari penjualan barang atau jasa selama setahun, sebelum dikurangi biaya apa pun. Ini baris paling atas laporan laba rugi, sering disebut omzet. Besarnya pendapatan belum menyatakan untung, karena biayanya belum dipotong.',
  },
  {
    term: 'Beban pokok pendapatan',
    definition:
      'Biaya langsung untuk membuat atau menyediakan barang yang dijual — bahan baku, upah produksi, ongkos pabrik. Untuk warung mi, ini harga mi, telur, dan gasnya. Belum termasuk gaji kantor dan biaya iklan.',
  },
  {
    term: 'Laba kotor',
    definition:
      'Pendapatan dikurangi biaya langsung membuat barangnya. Angka ini menunjukkan berapa yang tersisa untuk membayar gaji kantor, sewa, bunga, dan pajak. Belum untung bersih.',
  },
  {
    term: 'Pendapatan bunga',
    definition:
      'Uang yang diterima bank dari bunga kredit yang disalurkannya. Ini sumber penghasilan utama bank, setara dengan penjualan pada perusahaan biasa.',
  },
  {
    term: 'Beban bunga',
    definition:
      'Bunga yang harus dibayarkan perusahaan atas uang yang dipinjamnya. Pada bank, ini termasuk bunga yang dibayarkan kepada nasabah penyimpan.',
  },
  {
    term: 'Pendapatan bunga bersih',
    definition:
      'Selisih antara bunga yang diterima bank dari peminjam dan bunga yang dibayarkannya kepada penyimpan. Inilah keuntungan pokok usaha bank: meminjam murah, meminjamkan lebih mahal.',
  },
  {
    term: 'Pendapatan non-bunga',
    definition:
      'Penghasilan bank di luar bunga — biaya administrasi, komisi transfer, hasil jual beli valuta asing. Sumber ini tidak ikut naik-turun bersama suku bunga, sehingga menambah kestabilan penghasilan bank.',
  },
  {
    term: 'Beban usaha',
    definition:
      'Biaya menjalankan perusahaan yang tidak menempel langsung pada produknya — gaji kantor, sewa, listrik, pemasaran. Biaya ini tetap harus dibayar meski penjualan sedang sepi.',
  },
  {
    term: 'Laba usaha',
    definition:
      'Untung dari kegiatan pokok perusahaan, setelah semua biaya produksi dan biaya kantor dipotong, tetapi sebelum bunga pinjaman dan pajak. Ini ukuran seberapa sehat usahanya sendiri, terlepas dari cara membiayainya.',
  },
  {
    term: 'EBITDA',
    definition:
      'Untung sebelum dipotong bunga, pajak, dan penyusutan nilai aset. Gunanya membandingkan kemampuan menghasilkan uang antar-perusahaan tanpa terganggu perbedaan besar utang dan cara mencatat penyusutan. Bukan uang tunai yang benar-benar diterima.',
  },
  {
    term: 'Laba sebelum pajak',
    definition:
      'Untung yang tersisa setelah seluruh biaya dan bunga dibayar, tetapi sebelum setoran pajak ke negara.',
  },
  {
    term: 'Beban pajak',
    definition: 'Pajak penghasilan yang menjadi kewajiban perusahaan atas laba tahun itu.',
  },
  {
    term: 'Laba bersih',
    definition:
      'Untung yang benar-benar tersisa setelah semuanya dibayar — biaya, bunga, dan pajak. Inilah bagian yang menjadi hak pemilik saham, entah dibagikan sebagai dividen atau ditahan untuk mengembangkan usaha.',
  },

  {
    term: 'Kas',
    definition:
      'Uang tunai perusahaan dan saldo yang bisa dipakai seketika di rekening banknya. Bagian harta yang paling siap dipakai membayar apa pun.',
  },
  {
    term: 'Aset lancar',
    definition:
      'Harta yang diperkirakan berubah menjadi uang dalam waktu setahun — kas, tagihan ke pelanggan, dan barang dagangan. Dipakai untuk menilai apakah perusahaan sanggup membayar kewajiban jangka pendeknya.',
  },
  {
    term: 'Aset tetap',
    definition:
      'Harta berumur panjang yang dipakai menjalankan usaha, bukan untuk dijual — tanah, gedung, mesin, kendaraan.',
  },
  {
    term: 'Persediaan',
    definition:
      'Barang yang masih tersimpan dan belum terjual, termasuk bahan baku dan barang setengah jadi. Persediaan yang menumpuk jauh lebih cepat daripada penjualan biasanya berarti barangnya sulit laku.',
  },
  {
    term: 'Kredit disalurkan',
    definition:
      'Total uang yang sedang dipinjamkan bank kepada nasabahnya. Versi bruto adalah jumlah penuhnya; versi neto sudah dikurangi cadangan untuk kredit yang diperkirakan macet.',
  },
  {
    term: 'Total aset',
    definition:
      'Nilai seluruh harta yang dikelola perusahaan, tidak peduli dibiayai uang pemilik atau uang pinjaman. Selalu sama besar dengan total liabilitas ditambah total ekuitas.',
  },
  {
    term: 'Liabilitas lancar',
    definition:
      'Kewajiban yang harus dilunasi dalam waktu setahun — utang ke pemasok, gaji terutang, cicilan yang jatuh tempo.',
  },
  {
    term: 'Liabilitas jangka panjang',
    definition: 'Kewajiban yang baru jatuh tempo lebih dari setahun lagi, misalnya pinjaman bank bertenor panjang atau obligasi.',
  },
  {
    term: 'Simpanan nasabah',
    definition:
      'Seluruh uang yang dititipkan nasabah di bank berupa giro, tabungan, dan deposito. Bagi bank ini tercatat sebagai kewajiban karena uangnya milik nasabah dan sewaktu-waktu bisa ditarik — sekaligus menjadi bahan bakar utama usahanya.',
  },
  {
    term: 'Total liabilitas',
    definition:
      'Seluruh kewajiban perusahaan kepada pihak lain bila dijumlahkan. Pada bank angkanya wajar sangat besar karena simpanan nasabah ikut terhitung di sini.',
  },
  {
    term: 'Utang berbunga',
    definition:
      'Bagian kewajiban yang benar-benar berupa pinjaman berbunga, seperti kredit bank dan obligasi. Berbeda dari total liabilitas, yang juga memuat kewajiban tanpa bunga seperti tagihan pemasok yang belum dibayar.',
  },
  {
    term: 'Utang bersih',
    definition:
      'Utang berbunga dikurangi kas yang dipegang perusahaan. Menggambarkan sisa utang seandainya seluruh uang tunainya dipakai melunasi pinjaman lebih dulu. Angka negatif berarti kasnya melebihi utangnya.',
  },
  {
    term: 'Saldo laba ditahan',
    definition:
      'Kumpulan laba dari tahun-tahun sebelumnya yang tidak dibagikan sebagai dividen, melainkan ditinggal di dalam perusahaan untuk dipakai tumbuh.',
  },
  {
    term: 'Total ekuitas',
    definition:
      'Bagian harta yang benar-benar milik pemegang saham, yaitu seluruh harta dikurangi seluruh kewajiban. Sering disebut nilai buku perusahaan.',
  },

  {
    term: 'Arus kas dari operasi',
    definition:
      'Uang tunai yang benar-benar masuk dan keluar dari kegiatan usaha sehari-hari. Berbeda dari laba bersih, yang ikut menghitung penjualan yang belum dibayar pelanggan. Perusahaan sehat umumnya menghasilkan angka positif di sini setiap tahun.',
  },
  {
    term: 'Arus kas dari investasi',
    definition:
      'Uang yang keluar untuk membeli aset jangka panjang seperti mesin dan gedung, atau masuk dari menjualnya. Angka negatif di sini lazim dan sering justru pertanda perusahaan sedang memperbesar kapasitasnya.',
  },
  {
    term: 'Arus kas dari pendanaan',
    definition:
      'Uang yang berhubungan dengan pemilik dan pemberi pinjaman — menarik pinjaman baru, melunasi utang, membagikan dividen, atau menerbitkan saham baru.',
  },
  {
    term: 'Belanja modal',
    definition:
      'Uang yang dikeluarkan untuk membeli atau memperbarui aset jangka panjang seperti pabrik, mesin, dan perangkat teknologi. Sering disingkat capex.',
  },
  {
    term: 'Arus kas bebas',
    definition:
      'Uang tunai yang tersisa dari kegiatan usaha setelah dipakai membeli dan merawat aset jangka panjangnya. Inilah bagian yang benar-benar leluasa dipakai membayar utang, membagikan dividen, atau menabung.',
  },
  {
    term: 'Kenaikan/penurunan kas bersih',
    definition:
      'Selisih saldo kas awal dan akhir tahun, yaitu penjumlahan arus kas dari operasi, investasi, dan pendanaan. Menyatakan apakah uang tunai perusahaan bertambah atau berkurang sepanjang tahun itu.',
  },

  {
    term: 'Payout ratio',
    definition:
      'Berapa bagian dari laba setahun yang dibagikan kepada pemegang saham sebagai dividen. Nilai 40 persen berarti empat puluh dari tiap seratus rupiah laba dibagikan, sisanya ditahan untuk mengembangkan usaha.',
  },
  {
    term: 'Ex-date',
    definition:
      'Tanggal batas kepemilikan saham untuk berhak atas satu pembagian dividen. Membeli saham pada atau setelah tanggal ini berarti dividen kali itu jatuh kepada pemilik sebelumnya.',
  },
  {
    term: 'Papan pencatatan',
    definition:
      'Kelompok tempat sebuah emiten dicatat di Bursa Efek Indonesia — Utama, Pengembangan, atau Ekonomi Baru. Pengelompokannya mengikuti ukuran perusahaan dan lamanya beroperasi, bukan bagus tidaknya kinerja.',
  },
  {
    term: 'YoY',
    definition:
      'Singkatan dari year on year, yaitu perbandingan satu angka terhadap angka yang sama setahun sebelumnya. Dipakai supaya perubahannya terbaca sebagai arah, bukan sekadar selisih.',
  },
];

export function glossaryAsContext(): Record<string, string> {
  return Object.fromEntries(GLOSSARY.map((g) => [g.term, g.definition]));
}
