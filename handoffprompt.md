# Prompt handoff — Stocket (Sectors Hackathon 2026, Track 3)

Salin seluruh isi di bawah garis ini ke chat baru.

---

Kamu melanjutkan proyek yang sudah berjalan. Baca konteks ini sampai habis sebelum menulis kode.

## Proyek

**Stocket** — produk market intelligence untuk investor pemula Indonesia, memakai Sectors API. Lomba: **Sectors Hackathon 2026, Track 3 (Market Intelligence)**. Peserta solo: Nick Wilsan.

- Path: `C:\Users\ACER\Documents\Lomba\Hackathon Sectors`
- Repo publik: `github.com/Nick-Wilsan/sectors-hackathon-2026`, branch `main`
- Frontend: React 19 + Vite + TypeScript + **Tailwind v4** (`frontend/`)
- Backend: Node + Express + TypeScript (`backend/`), jalan di port 4000
- AI: Gemini `gemini-3.5-flash-lite` (kuota harian kecil, pernah kena batas 20 req/hari)
- Terminal user: **PowerShell 5.1 — tidak mengenal `&&`**. Beri perintah satu per baris atau pakai `;` + `if ($?)`.

## Tenggat dan penilaian

- Pendaftaran tutup **22 September 2026, 23:59 WIB** (lebih awal dari deadline submit — mudah terlewat)
- Submit tutup **30 September 2026, 23:59 WIB**; repo **beku total** setelah submit
- Bobot juri: **real-world usability 40%**, **video demo & storytelling 30%**, **technical depth 30%**
- Deliverable selain repo: video teaser 1 menit (publik), video juri maks 3 menit, satu kalimat problem statement, track + nama peserta, dan post media sosial menandai akun Sectors
- Jumlah fitur **tidak dinilai**. Jangan menambah fitur kecuali diminta.

## Batasan keras — melanggar ini bisa mendiskualifikasi

1. **Dilarang memberi rekomendasi investasi.** Tidak ada beli/jual/tahan, tidak ada target harga, tidak ada sinyal konsensus.
2. **Dilarang memprediksi arah harga** atau menyatakan probabilitas pergerakan.
3. **Dilarang menyimpulkan "murah" atau "mahal"** pada valuasi. Boleh menyatakan selisih terhadap rata-rata peer sebagai fakta, berhenti di situ.
4. **Dilarang eksekusi transaksi.**
5. Lapisan AI **hanya menjelaskan angka yang sudah dihitung** lapisan analisis. AI tidak boleh memanggil Sectors API sendiri.
6. **API key tidak pernah masuk repo.** `.env` di-gitignore, hanya `.env.example` kosong yang di-track.
7. Disclaimer "bukan rekomendasi investasi" wajib tampil.

Mockup acuan mengandung elemen yang **melanggar** aturan ini — "SKOR STOCKET AI: STRONG BUY (92/100)", "Sinyal Konsensus: SANGAT BELI 16/5/1", dan berita dengan "Rekomendasi Buy". **Jangan direplikasi.** Ganti dengan padanan faktual yang bobot visualnya setara.

## Kredit API — sumber daya paling langka

Angka di bawah dibaca langsung dari dashboard Sectors (Settings → Plans & Usage) pada **6 September 2026**, bukan estimasi:

- Kuota **Sectors Hackathon 2026: 371 tersisa**, kedaluwarsa 30 Sep 2026 (sama dengan tenggat submit). Ini yang terpakai lebih dulu.
- Pool kedua **Credits: 700**, kedaluwarsa 4 Mar 2027 — cadangan setelah kuota hackathon habis.
- 632 request tercatat pada periode ini.

**JANGAN menghitung kredit dari jumlah berkas di `backend/.cache/`.** Metode itu selalu terlalu rendah: fetch ulang atas URL yang sama menimpa berkas lama tanpa menambah jumlahnya. Terbukti 5–6 Sep: berkas bertambah 43, kredit sebenarnya terpakai 82. Penghitung yang benar adalah baris `[sectors] credit spent` di log backend; dashboard adalah rujukan akhir.

- Cache file di `backend/src/data/cache.ts`, berkunci URL lengkap. TTL default **30 hari** (widget pasar 24 jam) — dinaikkan dari 24 jam pada 5 Sep karena setiap hari kerja baru membayar ulang payload yang sama.
- `sectorsClient.ts` men-dedup permintaan yang sedang berjalan (peta in-flight). Tanpa ini, dua panggilan paralel untuk URL identik sama-sama miss dan ditagih dua kali. **Jangan hapus pola ini.**
- Setiap fetch nyata mencetak `[sectors] credit spent (#n this run)` ke log backend. Baca log itu untuk mengetahui biaya sebenarnya, jangan menaksir.
- **Selalu cek apakah data sudah ada di payload yang ter-cache sebelum menambah panggilan baru.** Sebagian besar fitur terbaik di proyek ini lahir dari memetakan ulang payload lama, bukan fetch baru.
- Contoh nyata: `getFundamentalExtras` sudah mengambil section `valuation` + `dividend` + `financials`, tapi dulu hanya memakai tahun terakhir. Memetakan `historical_valuation` dan `historical_financials` menghasilkan tabel multiples 5 tahun + grafik laba tahunan dengan **0 kredit**.
- Rentang tanggal: pakai `recentRange(hari)` dari `dateRange.ts`. Helper ini **hanya mengirim `start`** dan men-snap-nya ke awal pekan. **Jangan pernah mengirim `end`** — sudah diuji, ketiga endpoint berentang tanggal mengembalikan bar terbaru tanpa `end`, sedangkan mengirim tanggal hari ini hanya mengganti cache key setiap hari dan menagih ulang kredit. Sebelum rekaman video, hapus berkas cache harga agar dapat data paling segar.
- `/v2/news/` memotong `limit` di **30** secara diam-diam — `limit=50` mengembalikan 30 baris tanpa error.
- **Pos kredit termahal: fitur kemiripan pola** (~15 kredit tiap sub-sektor baru dibuka, satu panggilan harga per peer). Kalau kredit menipis, ini tuas pertama yang dipangkas.
- **Laporkan biaya kredit setiap perubahan** yang menambah panggilan.

## Batasan data yang sudah terbukti

- `/v2/daily/{symbol}` hanya mengembalikan **±62 bar (~90 hari)**. Rentang 6 bulan / YTD / 1 tahun / 5 tahun **tidak mungkin**.
- Sectors **tidak menyediakan**: order book / order flow, net foreign flow, NPL Gross, market cap per peer dalam satu panggilan, ranking sektor, dan kategori berita ala "Dividen / Keterbukaan BEI / Riset Analis".
- Berita punya `tags` asli dari sumber, termasuk tag sentimen `Bullish`/`Bearish`/`Neutral` — **saring tag sentimen sebelum ditampilkan**, karena menampilkannya terbaca sebagai pandangan produk terhadap harga.
- Jumlah emiten di indeks: **962**. Sub-sektor: **33**. (Dua angka ini terverifikasi dan aman dipakai di UI/video.)

## Sistem desain — patuhi persis

Token ada di `frontend/src/index.css`, disalin verbatim dari mockup. Jangan pakai Tailwind neutral bawaan.

```
bg-background-base   #0a0a0a      surface-card      #171717
border-subtle        #262626      surface-container-lowest #0e0e0e
text-primary         #f5f5f5      text-secondary    #a3a3a3    text-muted #737373
primary-container    #0ea5e9      accent-hover      #38bdf8
state-positive       #10b981      state-negative    #f43f5e    state-warning #f59e0b
```

- Font: **Space Grotesk** (display/judul), **Inter** (body), **JetBrains Mono** (semua angka, wajib `tabular-nums`)
- Spacing: `space-2` … `space-32`. Container halaman: `max-w-[1440px] px-space-16`
- Ikon: **Material Symbols Outlined** (sudah dimuat di `index.html`)
- Kelas Tailwind **tidak boleh dirangkai dinamis**. `text-${tone}` tidak akan pernah ter-compile karena Tailwind memindai teks sumber. Pakai peta kelas statis.

## Ekspektasi desain — ini yang paling sering saya salah

User sudah dua kali mengoreksi hal yang sama: **menyalin informasi mockup saja tidak cukup, desainnya juga harus sama.**

- **Lebih banyak visual daripada teks.** Setiap angka penting sebaiknya punya pendamping visual: bar, gauge, mini bar chart, sparkline, atau chip berwarna.
- **Hias teksnya.** Sorotan berwarna di dalam paragraf (ticker biru, angka putih tebal, status hijau/merah), eyebrow mono uppercase, chip kategori.
- Pola kartu yang dipakai di halaman emiten dan terbukti disetujui: **judul + ikon → deskripsi singkat → angka besar → bar → catatan kaki berikon dan berwarna**.
- **Ruang kosong harus diisi** dengan visual yang relevan, bukan dibiarkan. Kalau satu kolom lebih pendek dari kolom sebelahnya, isi dengan panel yang masuk akal di situ.
- Arah keseluruhan: **padat dan ramai seperti terminal trading**, bukan minimalis. Kata user: "keunikannya ada di kepadatan dan keramaian pagenya". Tapi jargonnya tetap harus ramah pemula lewat glosarium dan AI explainer.
- **Dilarang ada tombol/kolom mati.** Placeholder "—", tombol `disabled`, dan menu tanpa halaman terbaca sebagai prototipe setengah jadi. Kalau datanya tidak ada, hapus kolomnya, jangan diisi strip.

Mockup ada di `frontend/Mockup/{Dashboard, Detail Stock, Daftar Berita, Detail Berita}/` — masing-masing berisi `code.html`, `DESIGN.md`, dan `screen.png`. **Baca ketiganya sebelum mulai.**

## Cara kerja yang diharapkan

1. **Cek data dulu, baru janji.** Sebelum bilang sebuah section bisa dibuat, buktikan datanya ada — panggil endpoint-nya atau baca file cache di `backend/.cache/`.
2. **Verifikasi di browser, bukan cuma compile.** "Build lolos" bukan bukti fitur bekerja. Klik tombolnya, hover chart-nya, screenshot hasilnya.
3. **Cek angka dengan tangan** dan nyatakan secara eksplisit mana yang diverifikasi dan mana yang diasumsikan. User membedakan tajam antara "berjalan tanpa error" dan "angkanya benar" — jangan pernah menyamakan keduanya dalam laporan.
4. **Jujur soal yang tidak bisa dibuat.** Kalau datanya tidak ada, katakan, jangan karang. Kejujuran data adalah pembeda utama produk ini.
5. **Satu rekomendasi kuat**, bukan daftar pilihan. Kalau ada trade-off, sebutkan pilihanmu dan alasannya.
6. **Update `docs/` seiring implementasi.** Technical Spec (log keputusan di tabel terakhir), API Data Dictionary (log kredit + katalog endpoint), Roadmap (status task). Pakai `python-docx` dan `openpyxl` — keduanya tersedia.
7. **Jangan commit/push tanpa diminta.**

## Keadaan sekarang

Commit terakhir `e5e151c` di `main`. **Dua commit belum di-push ke GitHub** (`e84d25f` dan `e5e151c`) — repo publik masih tertinggal, padahal juri menilai lewat repo.

Sudah selesai dan disetujui user:
- **Dashboard** (`/`) — urutan halaman dibalik agar analisis turunan tampil lebih dulu; screener multi-faktor dengan 5 persentil komponen; strip deteksi anomali lintas emiten teramai; asisten AI mengambang
- **Detail emiten** (`/emiten/:symbol`) — kartu identitas + sparkline, chart dengan toolbar berfungsi penuh, konteks sub-sektor, tabel multiples 5 tahun, statistik harga, kabar emiten

Endpoint backend yang ada:
```
GET  /api/market/overview        /api/market/sorotan     /api/market/anomali    /api/market/news
GET  /api/screener               /api/subsectors         /api/companies
GET  /api/emiten/:symbol/skor    /peer  /framework  /anomali  /harga  /pola  /indikator
     /kemiripan  /tambahan  /berita
POST /api/emiten/:symbol/tanya
```

## Tugas berikutnya, berurutan

**1. ~~Verifikasi independen skor komposit~~ — SELESAI 5 Sep 2026.**
Skrip di `docs/verifikasi/verify_score.py` (Python, ditulis dari spesifikasi, baca cache mentah, tidak impor kode app). BBCA 78,33 / BBRI 64,69 / BIRD 68,33 — cocok persis dengan aplikasi, selisih nol. Persentil juga dicek dengan tangan, dan keempat rasio arah-positif direproduksi dari baris laporan keuangan mentah. Jalankan ulang kapan saja: `python docs/verifikasi/verify_score.py` (0 kredit bila cache hangat).
Dua hal yang ditemukan dan **masih terbuka**:
- `debt_to_equity_ratio` Sectors = **total_liabilities/equity**, bukan total_debt/equity (BBCA 4,63 vs 0,0085). Perbandingan tetap adil, tapi label "Kesehatan Utang" menyesatkan untuk bank karena simpanan nasabah terhitung liabilitas. Perlu penjelasan di glosarium.
- Jalur `partial` (tepat 1 komponen kosong) tidak tersentuh oleh satu pun dari 198 emiten ter-cache — hanya teruji sintetis.

**2. ~~Halaman Berita~~ — SELESAI 6 Sep 2026.**
`/berita` dibangun ulang penuh dengan sistem token: hero + panel emiten paling sering diberitakan, grid/daftar 8 kartu, 4 panel facet berbar, pencarian + filter sub-sektor + chip topik + urutan, paginasi 15 halaman. Endpoint baru `GET /api/market/berita` (`backend/src/analysis/newsIndex.ts`) mengambil korpus 120 artikel sekali; seluruh interaksi penyaringan berbiaya **0 kredit**.
Yang sengaja TIDAK direplikasi dari mockup, dan alasannya:
- Panel "Aksi Korporasi Terdekat" dan formulir "Morning Brief" — tidak ada endpointnya, akan jadi kolom mati
- Kartu "Riset Sekuritas" dengan target harga + "Rekomendasi Buy" — melanggar larangan rekomendasi
- Filter rentang tanggal — 120 artikel terbaru cuma mencakup **3 hari kalender**, kontrolnya tak akan pernah mengubah hasil
Penggantinya data nyata: peringkat tag, emiten paling sering disebut, sumbu `dimension` milik Sectors, dan peringkat media penerbit.
**Catatan data:** `body` artikel median hanya ~790 karakter (ringkasan, bukan naskah penuh) — ini menentukan rancangan tugas 3.

**3. ~~Halaman Detail Berita~~ — SELESAI 6 Sep 2026.**
Route `/berita/:id` di `frontend/src/pages/NewsDetailPage.tsx`. Penanda = 10 karakter SHA-1 dari URL sumber, dihitung di `newsIndex.ts`. Memakai korpus yang sama dengan `/berita` — **0 kredit** per kunjungan.
Isi: chip topik, judul, strip meta + salin tautan, gambar berkapsi, ringkasan, kotak pernyataan "ini ringkasan bukan naskah penuh" + tombol ke penerbit, chip topik terkait, grid Berita Lainnya. Sidebar: Emiten yang Disebut (dengan jumlah pemberitaan), Profil Isi Artikel (sumbu `dimension`), Berita Terkait, kotak hak cipta.
Yang TIDAK direplikasi: panel "Sectors AI Sentiment Score 8,5/10 BULLISH" (melanggar larangan arah harga — diganti Profil Isi Artikel), tabel jadwal aksi korporasi, harga real-time di strip emiten, formulir notifikasi — semuanya tidak ada datanya.
**Peringkat berita terkait:** emiten sama = 4, sub-sektor sama = 2, +1 per tag beririsan.

**4. ~~Fitur menggantung~~ — SELESAI 6 Sep 2026.**
- Tiga menu nav tanpa halaman: `Sektor IDX` dan `Screener` jadi jangkar ke section nyata di dashboard (`#sektor-idx`, `#screener-emiten`); `Chart & Analisis` dan `Komunitas & Ide` dihapus (chart hidup di halaman emiten, komunitas tak punya data). **Nol menu mati.**
- Dua tombol `disabled` di `FeaturedStockPanel` dihapus, diganti satu tautan ke `/emiten/BBCA`. Watchlist & price alert butuh akun + notifikasi yang tidak ada di produk ini — selamanya mati, jadi lebih jujur dihapus.
- Tooltip glosarium (task 31) **selesai**: `components/GlossaryTerm.tsx` + endpoint `GET /api/market/glosarium`. Definisinya dari `backend/src/ai/glossary.ts` — berkas yang sama dengan konteks AI, jadi tooltip dan jawaban asisten tidak pernah beda. Terpasang di 5 header screener + kartu skor emiten.
- Bug ticker `BBCA.JK.JK` diperbaiki.
- Label `Kesehatan Utang (DER)` → **`Struktur Modal (DER)`**, dan definisi kamusnya dikoreksi (pembilangnya total liabilitas; untuk bank wajar tinggi karena simpanan nasabah ikut terhitung).
- Navbar diperbesar 12px → 14px, ambang tampil `xl` → `lg`, jarak antaritem dinaikkan.
- **Lubang baru yang ditemukan & ditutup:** di bawah `lg`, nav utama DAN kolom pencarian sama-sama tersembunyi — ponsel praktis tanpa navigasi. Ditambahkan baris nav ringkas `lg:hidden`.

**Dua kegagalan senyap yang hanya ketahuan dari uji di peramban:**
- `scrollIntoView({behavior:'smooth'})` digerakkan rAF dan **berhenti saat tab tidak digambar** — jangkar gagal tanpa error. Pakai `behavior:'auto'`.
- 4 dari 5 tooltip header screener tidak pernah muncul karena label tampilan dipakai sebagai kunci kamus. Kunci glosarium kini dipisah dari label tampilan.

## Jebakan teknis yang sudah pernah menghabiskan waktu

- **lightweight-charts mempertahankan bar spacing saat resize.** Wajib panggil `fitContent()` setiap lebar berubah, kalau tidak semua candle menumpuk di tepi kanan.
- **Grid default `items-stretch`.** Kolom yang lebih pendek akan meregang dan menyisakan ruang hitam. Pakai `items-start` bila tinggi kolom berbeda.
- **`requestFullscreen()` bisa resolve tanpa benar-benar masuk layar penuh** di sebagian embedder. Periksa `document.fullscreenElement` setelahnya, jangan percaya promise-nya.
- **Screenshot browser sering gagal setelah scroll.** Cara andal: sembunyikan section di atasnya lewat JS (`style.display='none'`), lalu screenshot.
- **`screener.ts` dulu menelan kegagalan fetch peer diam-diam**, yang menggeser semua skor tanpa error. Sudah diperbaiki jadi `fetchFailures` + komponen `PeerDataWarning`. Jangan kembalikan pola menelan error itu di tempat lain.

## Standar penerimaan sebelum menyatakan selesai

- `npm run build` di `frontend/` lolos
- `npx tsc --noEmit` di `backend/` bersih
- `npx oxlint` tidak menambah warning baru (baseline: **4 warning lama**)
- Tidak ada error console di tab browser yang baru dibuka
- Tidak ada overflow horizontal di lebar 390px
- Diuji pada **minimal dua emiten berbeda**, bukan hanya BBCA
- Tidak ada sisa kode sementara/debug
