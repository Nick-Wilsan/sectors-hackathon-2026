import { useMemo } from 'react';
import type { CompositeScoreResult, FundamentalExtras, PeerComparisonResult } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';
import { scrollToSection } from '../lib/scrollToSection';

// Blok jawaban, ditempatkan tepat di bawah kartu identitas.
//
// Ditambahkan setelah uji pengguna 7 September 2026 pada dua responden pemula.
// Keduanya datang dengan satu pertanyaan — "apakah saham ini bagus dan
// harganya masuk akal?" — dan keduanya keluar tanpa jawaban meskipun setiap
// angka yang dibutuhkan sudah ada di halaman ini. Tiga temuan spesifik yang
// ditangani komponen ini:
//
//   Temuan 4. Tidak satu pun responden tahu angka Skor Komposit berasal dari
//             mana. Satu responden bahkan menyimpulkan bahwa lima kotak yang
//             dimulai dari "Kapitalisasi Pasar" adalah bahan perhitungannya —
//             kotak-kotak itu justru soal HARGA, bukan kinerja. Karena itu
//             kartu ini menyebut sumbernya sekaligus menyangkal yang bukan.
//   Temuan 5. Definisi harus dibaca berulang kali sebelum dipahami. Kalimat di
//             sini sengaja pendek dan memakai angka emiten yang sedang dibuka,
//             bukan definisi umum yang harus diterjemahkan sendiri pembacanya.
//   Temuan 6. Responden bisa menyimpulkan kualitas perusahaan, tetapi buntu
//             saat menakar harganya. Penyebabnya bukan data yang kurang: dua
//             pembanding harga sudah dihitung di halaman ini, hanya letaknya
//             jauh di bawah dan tidak pernah tercapai.
//
// Tidak ada panggilan API baru: seluruh isinya berasal dari `score`, `peer`,
// dan `extras` yang sudah diambil halaman ini — 0 kredit.
//
// Batas yang dijaga: PRD B-02 melarang anjuran beli/jual maupun pernyataan
// arah harga, dan bagian 6 PRD menuntut setiap keluaran berbentuk pernyataan
// faktual atau klasifikasi terhadap kriteria yang sudah didefinisikan.
// Kartu ini menyajikan DUA jangkar pembanding lalu berhenti, dan menjelaskan
// mengapa ia berhenti — sebab alasannya sendiri (perusahaan yang lebih kuat
// wajar dihargai lebih mahal) justru bagian yang perlu dipahami pemula.

interface Props {
  symbol: string;
  score: CompositeScoreResult | null;
  peer: PeerComparisonResult | null;
  extras: FundamentalExtras | null;
  /** Membuka panel Tanya AI. Uji pengguna: tidak seorang pun menyadari peluncurnya. */
  onAskAi: () => void;
}

function tier(score: number): { text: string; label: string; chip: string } {
  if (score >= 67) return { text: 'text-state-positive', label: 'Sehat', chip: 'bg-state-positive/10 text-state-positive' };
  if (score >= 34) return { text: 'text-state-warning', label: 'Netral', chip: 'bg-state-warning/10 text-state-warning' };
  return { text: 'text-state-negative', label: 'Kritis', chip: 'bg-state-negative/10 text-state-negative' };
}

/** Judul komponen skor tanpa singkatan dalam kurung — "Profitabilitas Modal
 *  (ROE)" menjadi "Profitabilitas Modal". Di dalam kalimat, singkatannya
 *  justru memutus alur baca. */
function namaPendek(label: string): string {
  return label.replace(/\s*\(.*\)\s*/, '').trim();
}

// Kunci kamus istilah per komponen skor, sama seperti di halaman detail:
// label tampil berbunyi "Profitabilitas Modal (ROE)" sementara kamus berkunci
// "ROE (Return on Equity)".
const GLOSARIUM_KOMPONEN: Record<string, string> = {
  roe: 'ROE',
  netProfitMargin: 'Margin laba',
  der: 'DER',
  ocfMargin: 'Margin Arus Kas Operasional',
  roa: 'ROA',
};

// Satu warna dengan lima tingkat kepekatan, bukan lima warna berbeda. Palet
// produk ini memakai hijau/kuning/merah untuk MENILAI, jadi memberi tiap
// komponen warnanya sendiri akan terbaca sebagai penilaian atas komponen itu —
// padahal yang dibedakan di sini hanya identitas potongan batang.
const OPASITAS = [1, 0.82, 0.64, 0.46, 0.3];

function Bagian({ nomor, judul, children }: { nomor: string; judul: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded border border-border-subtle bg-surface-container-lowest p-space-12">
      <h3 className="flex items-baseline gap-space-8 border-b border-border-subtle pb-space-8 font-headline-sm text-headline-sm font-bold text-text-primary">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-container font-label-mono-sm text-label-mono-sm text-primary">
          {nomor}
        </span>
        {judul}
      </h3>
      <div className="mt-space-12 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

/** Tautan lompat ke bagian lain halaman ini.
 *
 *  `mt-auto` mendorongnya ke dasar kolom. Kedua kolom tidak pernah sama
 *  panjang isinya, dan tanpa ini tombol yang satu berhenti lebih tinggi
 *  daripada tetangganya sehingga menyisakan ruang menganggur di bawahnya. */
function TautanBagian({ ke, children }: { ke: string; children: React.ReactNode }) {
  return (
    <div className="mt-auto pt-space-12">
      <a
        href={`#${ke}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          scrollToSection(ke);
        }}
        className="inline-flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 font-body-sm text-body-sm font-semibold text-primary transition-colors hover:border-primary-container hover:bg-surface-container hover:text-accent-hover"
      >
        <span className="material-symbols-outlined text-[16px]">south</span>
        {children}
      </a>
    </div>
  );
}

/** Penanda posisi satu angka di dalam rentangnya sendiri. Warnanya netral
 *  dengan sengaja: rasio harga yang rendah bukan otomatis kabar baik, dan
 *  memberinya warna hijau sama saja dengan menyatakan "murah" — vonis yang
 *  tidak dibuat produk ini. */
function PitaPosisi({ persen, kiri, kanan }: { persen: number; kiri: string; kanan: string }) {
  const jepit = Math.max(0, Math.min(100, persen));
  return (
    <div className="mt-space-6">
      <div className="relative h-1.5 w-full rounded-full bg-surface-container">
        <span
          className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-text-primary"
          style={{ left: `calc(${jepit}% - 2px)` }}
          aria-hidden
        />
      </div>
      <div className="mt-space-4 flex justify-between font-label-mono-sm text-label-mono-sm text-text-muted">
        <span>{kiri}</span>
        <span>{kanan}</span>
      </div>
    </div>
  );
}

export function EmitenAnswerCard({ symbol, score, peer, extras, onAskAi }: Props) {
  const kode = symbol.toUpperCase().replace(/\.JK$/, '');

  // Sumbangan tiap ukuran terhadap skor akhir, memakai rumus yang sama persis
  // dengan mesin skor di backend: persentil dikali bobot terpakai. Diurut dari
  // sumbangan terbesar supaya batang dan daftarnya terbaca menurun.
  const sumbangan = useMemo(
    () =>
      [...(score?.components ?? [])]
        .map((c) => ({ ...c, poin: c.percentile * c.weightUsed }))
        .sort((a, b) => b.poin - a.poin),
    [score],
  );

  // Rasio harga mana yang dipakai sebagai jangkar.
  //
  // Selama ini selalu P/E. Itu keliru untuk emiten yang merugi: Sectors tetap
  // mengirim angkanya, hanya bernilai negatif — VKTR misalnya, -2527x. Kartu
  // ini lalu menghitung selisihnya terhadap rata-rata pesaing yang positif dan
  // mengumumkan "24.436% lebih rendah, pasar membayar lebih murah untuk tiap
  // rupiah laba". Kalimat itu bukan sekadar janggal, ia salah: tidak ada laba
  // yang sedang dibeli murah, perusahaannya sedang rugi. Glosarium produk ini
  // pun sudah menyatakannya — "Tidak bisa dihitung jika perusahaannya rugi".
  //
  // Karena itu P/E hanya dipakai bila positif. Bila tidak, jangkarnya berpindah
  // ke PBV, yang tetap bermakna pada perusahaan merugi karena membandingkan
  // harga terhadap kekayaan bersih, bukan terhadap laba. Sectors mengirim
  // rata-rata peer untuk PBV pada tahun buku yang sama, jadi perbandingannya
  // tetap nyata dan tidak menambah satu pun panggilan API.
  const jangkar = useMemo(() => {
    const pe = extras?.pe ?? null;
    if (pe !== null && Number.isFinite(pe) && pe > 0) {
      return {
        kunci: 'pe' as const,
        istilah: 'P/E Ratio',
        nama: `P/E ${extras?.year ?? ''}`.trim(),
        nilai: pe,
        peer: extras?.pePeerAvg ?? null,
        penjelasan: 'Harga saham dibagi laba setahun.',
        satuanPeer: 'laba',
      };
    }
    const pb = extras?.pb ?? null;
    const pbPeer = extras?.historicalValuation?.[extras.historicalValuation.length - 1]?.pbPeerAvg ?? null;
    if (pb !== null && Number.isFinite(pb) && pb > 0) {
      return {
        kunci: 'pb' as const,
        istilah: 'PBV',
        nama: `PBV ${extras?.year ?? ''}`.trim(),
        nilai: pb,
        peer: pbPeer,
        penjelasan: 'Harga saham dibanding kekayaan bersih perusahaan menurut pembukuannya.',
        satuanPeer: 'kekayaan bersih',
      };
    }
    return null;
  }, [extras]);

  /** Emiten yang merugi, sehingga P/E-nya tidak dapat dipakai. */
  const labaNegatif = extras?.pe !== null && extras?.pe !== undefined && extras.pe <= 0;

  // Jangkar kedua: posisi rasio sekarang di dalam rentangnya sendiri selama
  // tahun-tahun yang dilaporkan. Butuh minimal tiga tahun — dua titik tidak
  // membentuk "kebiasaan" yang bisa dijadikan pembanding. Nilai yang tidak
  // positif dibuang dengan alasan yang sama seperti di atas.
  const riwayat = useMemo(() => {
    if (!jangkar) return null;
    const seri = (extras?.historicalValuation ?? [])
      .map((r) => ({ year: r.year, nilai: r[jangkar.kunci] }))
      .filter((r): r is { year: number; nilai: number } => r.nilai !== null && Number.isFinite(r.nilai) && r.nilai > 0);
    if (seri.length < 3) return null;
    const nilai = seri.map((r) => r.nilai);
    const min = Math.min(...nilai);
    const max = Math.max(...nilai);
    if (max === min) return null;
    const persen = ((jangkar.nilai - min) / (max - min)) * 100;
    return {
      min,
      max,
      persen,
      tahunAwal: seri[0].year,
      tahunAkhir: seri[seri.length - 1].year,
      posisi: persen <= 33 ? 'bawah' : persen >= 67 ? 'atas' : 'tengah',
    };
  }, [extras, jangkar]);

  const selisihPeer =
    jangkar && jangkar.peer !== null && jangkar.peer > 0 ? (jangkar.nilai - jangkar.peer) / jangkar.peer : null;

  const t = score?.score !== null && score?.score !== undefined ? tier(score.score) : null;
  const adaJangkarHarga = jangkar !== null && (selisihPeer !== null || riwayat !== null);

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      {/* Kepala kartu dijadikan dua kolom. Sebelumnya seluruh isinya menumpuk
          di kiri dan menyisakan separuh lebar kartu kosong di kanan; ajakan
          bertanya ke AI yang tadinya menggantung di kaki kartu dipindahkan ke
          sana — mengisi ruang yang menganggur sekaligus naik ke tempat yang
          lebih mungkin terbaca. */}
      <div className="flex flex-col gap-space-12 border-b border-border-subtle pb-space-12 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex min-w-0 items-start gap-space-8">
          {/* `mt-[2px]` menurunkan ikon setipis itu agar pusatnya sejajar
              dengan tinggi huruf judul, bukan dengan kotak barisnya. */}
          <span className="material-symbols-outlined mt-[2px] shrink-0 text-[22px] text-primary">quiz</span>
          <div className="flex min-w-0 flex-col gap-space-6">
            <h2 className="font-headline-md text-headline-md font-bold text-text-primary">
              Dua hal yang perlu dipisahkan sebelum menilai {kode}
            </h2>
            <p className="font-body-md text-body-md leading-relaxed text-text-secondary">
              Kekuatan perusahaannya, dan harga yang diminta pasar untuk kekuatan itu. Dua pertanyaan berbeda, dijawab
              angka yang berbeda.
            </p>
            {/* Konvensi tooltip dinyatakan sekali, di tempat pembaca pasti
                lewat. Uji pengguna: tidak seorang pun menemukannya sendiri. */}
            {/* Dikotakkan, bukan dibiarkan sebagai baris lepas. Ikon penanda
                di depannya membuat teksnya menjorok, dan sebagai baris lepas
                itu terbaca sebagai tepi kiri yang bergerigi terhadap judul dan
                paragraf di atasnya. Di dalam kotak, menjoroknya terbaca
                sebagai isi kotak — dan tepi kotaknya sendiri lurus dengan
                keduanya. */}
            <p className="mt-space-2 flex items-start gap-space-6 rounded border border-border-subtle bg-surface-container-lowest px-space-8 py-space-6 font-body-md text-body-md text-text-muted">
              <span className="material-symbols-outlined mt-[2px] shrink-0 text-[18px] text-primary">touch_app</span>
              <span>
                Setiap istilah bergaris titik-titik dengan tanda{' '}
                <sup className="font-label-mono-sm text-[10px] font-bold text-primary">?</sup> bisa disorot atau diklik
                untuk penjelasan singkat berbahasa sehari-hari.
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-space-6 rounded border border-border-subtle bg-surface-container-lowest p-space-12 lg:max-w-[280px]">
          <span className="flex items-center gap-space-4 font-table-header text-table-header uppercase text-text-muted">
            <span className="material-symbols-outlined text-[16px] text-primary">forum</span>
            Masih ada yang mengganjal?
          </span>
          <p className="font-body-sm text-body-sm text-text-muted">
            Tanyakan istilah apa pun di halaman ini, atau mengapa sebuah angka jadi segitu.
          </p>
          <button
            type="button"
            onClick={onAskAi}
            className="mt-space-2 flex items-center gap-space-6 rounded bg-primary-container px-space-12 py-space-6 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover"
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            Tanya AI tentang {kode}
          </button>
        </div>
      </div>

      <div className="mt-space-12 grid grid-cols-1 items-stretch gap-space-8 lg:grid-cols-2">
        {/* ---------- 1. kekuatan perusahaan ---------- */}
        <Bagian nomor="1" judul="Seberapa kuat perusahaannya?">
          {t && score?.score !== null && score?.score !== undefined ? (
            <>
              <div className="flex items-baseline gap-space-8">
                <span className={`font-display-lg text-display-lg tracking-tight tabular-nums ${t.text}`}>{score.score.toFixed(0)}</span>
                <span className="font-label-mono-md text-label-mono-md text-text-muted">/100</span>
                <span className={`rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${t.chip}`}>{t.label}</span>
              </div>

              <p className="mt-space-6 font-body-md text-body-md text-text-muted">
                Peringkat rata-rata {kode} di antara {score.components[0]?.groupSize ?? peer?.groupSize ?? 0} emiten{' '}
                <GlossaryTerm term="Sub-sektor">sub-sektor</GlossaryTerm> {peer?.subSector ?? ''}.
              </p>

              {/* Uraian penyusun skor, digambar alih-alih dikalimatkan.
                  Versi pertama blok ini memakai satu paragraf panjang, dan
                  masukan berikutnya tepat: pembaca melewatinya. Yang dicari
                  responden sebetulnya satu hal saja — "78 ini dari mana" — dan
                  pertanyaan itu dijawab paling jujur oleh penjumlahan yang
                  benar-benar dipakai mesin skor: persentil dikali bobot.
                  Batangnya menyatakan besar sumbangan tiap ukuran, sisanya yang
                  redup adalah jarak menuju 100. */}
              {/* Ukuran di blok ini dinaikkan satu tingkat setelah kolom sebelah
                  bertambah panjang oleh jangkar harga kedua. Sebelumnya kolom
                  ini berhenti 87 piksel lebih awal, dan ruang itu terisi tanpa
                  menambah satu kata pun — hanya dengan memberi angka penyusun
                  skor ukuran yang sepadan dengan perannya. */}
              <div className="mt-space-16">
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-container" role="img" aria-label={`Sumbangan tiap ukuran terhadap skor ${score.score.toFixed(0)} dari 100`}>
                  {sumbangan.map((s, i) => (
                    <div
                      key={s.key}
                      className="h-full bg-primary-container"
                      style={{ width: `${s.poin}%`, opacity: OPASITAS[i] ?? 0.4 }}
                    />
                  ))}
                </div>

                <ul className="mt-space-12 flex flex-col gap-space-6">
                  {sumbangan.map((s, i) => (
                    <li key={s.key} className="flex items-baseline gap-space-8 font-body-md text-body-md">
                      <span
                        className="mt-space-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-container"
                        style={{ opacity: OPASITAS[i] ?? 0.4 }}
                        aria-hidden
                      />
                      {/* Dipotong hanya mulai lebar sm. Di bawah itu kolomnya
                          terlalu sempit dan "Margin Arus Kas Operasional"
                          terpangkas jadi tak terbaca — membungkus ke baris
                          kedua lebih baik daripada menyembunyikan namanya. */}
                      <span className="min-w-0 flex-1 text-text-secondary sm:truncate">
                        <GlossaryTerm term={GLOSARIUM_KOMPONEN[s.key] ?? s.label}>{namaPendek(s.label)}</GlossaryTerm>
                      </span>
                      <span className="shrink-0 font-label-mono-md text-label-mono-md tabular-nums text-text-muted">
                        {s.percentile.toFixed(0)} × {(s.weightUsed * 100).toFixed(0)}%
                      </span>
                      <span className="w-11 shrink-0 text-right font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-text-primary">
                        {s.poin.toFixed(1)}
                      </span>
                    </li>
                  ))}
                  <li className="mt-space-4 flex items-baseline gap-space-8 border-t border-border-subtle pt-space-8 font-body-md text-body-md">
                    <span className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 font-semibold text-text-primary">Skor Komposit</span>
                    <span className={`w-11 shrink-0 text-right font-label-mono-lg text-label-mono-lg font-bold tabular-nums ${t.text}`}>
                      {score.score.toFixed(1)}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Menyangkal secara eksplisit apa yang TIDAK ikut dihitung. Satu
                  responden menyimpulkan sendiri bahwa deretan kotak harga di
                  kartu identitas adalah bahan perhitungan skor; tanpa kalimat
                  ini tidak ada apa pun di halaman yang membantahnya. */}
              <p className="mt-space-16 flex items-start gap-space-8 rounded border border-state-warning/30 bg-state-warning/10 p-space-12 font-body-md text-body-md leading-relaxed text-text-secondary">
                <span className="material-symbols-outlined mt-[1px] shrink-0 text-[20px] text-state-warning">price_change</span>
                <span>
                  <strong className="text-text-primary">Harga saham tidak ikut dihitung.</strong> P/E, PBV, dan kapitalisasi
                  pasar tidak masuk sama sekali &mdash; itu pertanyaan nomor 2.
                </span>
              </p>

              {/* Tautannya dulu berbunyi "Lihat kelima ukurannya satu per satu",
                  yang tidak menyebut nama bagian tujuannya. Pada layar lebar
                  bagian itu berada di kolom kanan sejajar grafik, sehingga
                  pembaca mendarat dan menyangka yang dimaksud adalah grafik. */}
              <TautanBagian ke="komponen-skor">Lihat angka asli tiap ukuran</TautanBagian>
            </>
          ) : (
            <p className="font-body-md text-body-md text-text-muted">
              Emiten ini tidak diberi skor karena data keuangannya tidak lengkap. Kekosongan itu sengaja dibiarkan daripada
              diisi angka yang menyesatkan.
            </p>
          )}
        </Bagian>

        {/* ---------- 2. harga ---------- */}
        <Bagian nomor="2" judul="Harganya sedang di mana?">
          {adaJangkarHarga && jangkar ? (
            <>
              <div className="flex items-baseline gap-space-8">
                <span className="font-display-lg text-display-lg tracking-tight tabular-nums text-primary">
                  {jangkar.nilai.toFixed(1)}x
                </span>
                <GlossaryTerm
                  term={jangkar.istilah}
                  className="rounded bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm text-text-secondary"
                >
                  {jangkar.nama}
                </GlossaryTerm>
              </div>
              <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
                {jangkar.penjelasan} Sendirian angka ini tidak berarti apa-apa, jadi disandingkan dengan pembanding di
                bawah.
              </p>

              {/* Kenapa yang dipakai bukan P/E, dinyatakan tepat di tempat
                  pembaca melihat rasio yang berbeda dari emiten lain. */}
              {labaNegatif && (
                <p className="mt-space-8 flex items-start gap-space-6 rounded border border-state-warning/30 bg-state-warning/10 p-space-8 font-body-sm text-body-sm text-text-secondary">
                  <span className="material-symbols-outlined mt-[1px] shrink-0 text-[16px] text-state-warning">info</span>
                  <span>
                    <strong className="text-text-primary">{kode} sedang merugi</strong>, jadi P/E tidak bisa dipakai &mdash;
                    membagi harga dengan laba negatif tidak menghasilkan angka yang berarti. Yang dipakai di sini
                    perbandingan terhadap kekayaan bersihnya.
                  </span>
                </p>
              )}

              {/* Tiap pembanding diberi kartunya sendiri, berikon dan berlencana.
                  Sebelumnya keduanya hanya dua blok teks beruntun berwarna sama
                  persis, sehingga tidak ada apa pun yang memberi tahu bahwa ini
                  DUA pengukuran terpisah.

                  Lencananya tetap satu rona biru untuk kedua arah, bukan
                  hijau-merah: P/E di atas rata-rata bukan kabar buruk dan di
                  bawah rata-rata bukan kabar baik, jadi warna bervalensi di
                  sini sama saja dengan menyelipkan vonis murah/mahal yang
                  justru ditolak kartu ini dua paragraf kemudian. */}
              <div className="mt-space-12 flex flex-col gap-space-8">
                {selisihPeer !== null && jangkar.peer !== null && (
                  <div className="rounded border border-border-subtle bg-background-base p-space-8">
                    <div className="flex items-baseline justify-between gap-space-8">
                      <span className="flex items-center gap-space-4 font-body-sm text-body-sm font-semibold text-text-secondary">
                        <span className="material-symbols-outlined text-[15px] text-primary">groups</span>
                        Dibanding pesaingnya
                      </span>
                      <span className="inline-flex items-center gap-space-2 rounded bg-primary-container/15 px-space-6 py-space-2 font-label-mono-md text-label-mono-md font-bold tabular-nums text-primary">
                        <span className="material-symbols-outlined text-[14px]">{selisihPeer >= 0 ? 'north' : 'south'}</span>
                        {Math.abs(selisihPeer * 100).toFixed(0)}%
                      </span>
                    </div>
                    {/* Skala pita: rata-rata peer ditaruh di tengah, dan selisih
                        60% ke salah satu arah menyentuh ujungnya. */}
                    <PitaPosisi
                      persen={50 + Math.max(-50, Math.min(50, (selisihPeer / 0.6) * 50))}
                      kiri="lebih rendah dari rata-rata"
                      kanan="lebih tinggi"
                    />
                    <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
                      Rata-rata pesaing{' '}
                      <strong className="font-label-mono-sm text-label-mono-sm tabular-nums text-text-primary">
                        {jangkar.peer.toFixed(1)}x
                      </strong>
                      . Pasar membayar lebih{' '}
                      <strong className="text-text-secondary">{selisihPeer >= 0 ? 'mahal' : 'murah'}</strong> untuk tiap rupiah{' '}
                      {jangkar.satuanPeer} {kode}.
                    </p>
                  </div>
                )}

                {riwayat && (
                  <div className="rounded border border-border-subtle bg-background-base p-space-8">
                    <div className="flex items-baseline justify-between gap-space-8">
                      <span className="flex items-center gap-space-4 font-body-sm text-body-sm font-semibold text-text-secondary">
                        <span className="material-symbols-outlined text-[15px] text-primary">history</span>
                        Dibanding kebiasaannya sendiri
                      </span>
                      <span className="inline-flex items-center rounded bg-primary-container/15 px-space-6 py-space-2 font-label-mono-md text-label-mono-md font-bold text-primary">
                        bagian {riwayat.posisi}
                      </span>
                    </div>
                    <PitaPosisi
                      persen={riwayat.persen}
                      kiri={`terendah ${riwayat.min.toFixed(1)}x`}
                      kanan={`tertinggi ${riwayat.max.toFixed(1)}x`}
                    />
                    <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">
                      Selama{' '}
                      <strong className="font-label-mono-sm text-label-mono-sm tabular-nums text-text-primary">
                        {riwayat.tahunAkhir - riwayat.tahunAwal + 1} tahun buku
                      </strong>{' '}
                      terakhir, {jangkar.istilah === 'PBV' ? 'PBV' : 'P/E'} {kode} tidak pernah keluar dari rentang ini.
                    </p>
                  </div>
                )}
              </div>

              {/* Berhenti di sini adalah keputusan, bukan kelalaian. Versi
                  pertama menyampaikannya sebagai satu paragraf empat baris dan
                  terbaca sebagai dinding teks; isinya sebenarnya dua kalimat
                  pendek, jadi sekarang ditulis begitu. */}
              <div className="mt-space-12 rounded border border-border-subtle bg-background-base p-space-8">
                <p className="flex items-start gap-space-6 font-body-sm text-body-sm text-text-secondary">
                  <span className="material-symbols-outlined mt-[1px] shrink-0 text-[16px] text-primary">balance</span>
                  <span>
                    <strong className="text-text-primary">Stocket berhenti di sini.</strong> Murah atau mahal bergantung pada
                    satu hal yang hanya bisa kamu nilai: apakah kekuatan di nomor 1 sepadan dengan selisih harga di nomor 2.
                  </span>
                </p>
                {/* Menyebut rasio yang benar-benar dipakai. Pada emiten merugi
                    jangkarnya PBV, dan kalimat yang tetap menyebut P/E akan
                    merujuk angka yang tidak ada di layar. */}
                <p className="mt-space-6 border-t border-border-subtle pt-space-6 font-body-sm text-body-sm text-text-muted">
                  {jangkar.istilah === 'PBV' ? 'PBV' : 'P/E'} rendah pada perusahaan lemah bukan penemuan barang murah.
                </p>
              </div>

              <TautanBagian ke="historis-valuasi">Lihat tabel Historis Valuasi</TautanBagian>
            </>
          ) : (
            <p className="font-body-md text-body-md leading-relaxed text-text-muted">
              Rasio harga emiten ini tidak dapat dihitung &mdash; umumnya karena labanya negatif dan nilai bukunya pun tidak
              tersedia, sehingga tidak ada pembanding yang jujur untuk disajikan di sini.
            </p>
          )}
        </Bagian>
      </div>

    </div>
  );
}
