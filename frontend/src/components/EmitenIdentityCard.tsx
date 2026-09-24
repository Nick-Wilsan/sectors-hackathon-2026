import type { CompositeScoreResult, DailyBar, FundamentalExtras, PeerComparisonResult } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';

interface Props {
  symbol: string;
  peer: PeerComparisonResult | null;
  score: CompositeScoreResult | null;
  extras: FundamentalExtras | null;
  bars: DailyBar[];
}

function tier(score: number): { text: string; chip: string; label: string } {
  if (score >= 67) return { text: 'text-state-positive', chip: 'bg-state-positive/10 text-state-positive', label: 'Sehat' };
  if (score >= 34) return { text: 'text-state-warning', chip: 'bg-state-warning/10 text-state-warning', label: 'Netral' };
  return { text: 'text-state-negative', chip: 'bg-state-negative/10 text-state-negative', label: 'Kritis' };
}

function formatIdrCompact(value: number): string {
  const n = (x: number) => x.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  if (value >= 1e12) return `Rp ${n(value / 1e12)} T`;
  if (value >= 1e9) return `Rp ${n(value / 1e9)} M`;
  if (value >= 1e6) return `Rp ${n(value / 1e6)} jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function Sparkline({ bars, positive }: { bars: DailyBar[]; positive: boolean }) {
  const closes = bars.slice(-90).map((b) => b.close);
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = closes.map((c, i) => `${(i / (closes.length - 1)) * w},${h - ((c - min) / span) * h}`);
  const stroke = positive ? 'var(--color-state-positive)' : 'var(--color-state-negative)';

  return (
    // `shrink-0` dengan lebar tetap: sebagai `flex-1` grafik mini ini ikut
    // berebut ruang dengan blok identitas dan blok harga, dan hasilnya berbeda
    // untuk tiap panjang nama emiten.
    <div className="hidden w-[160px] shrink-0 flex-col justify-center xl:flex">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-10 w-full" role="img" aria-label="Pergerakan harga 90 hari terakhir">
        <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="mt-space-2 text-center font-label-mono-sm text-label-mono-sm text-text-muted">
        {closes.length} hari bursa terakhir
      </span>
    </div>
  );
}

// `absent` menggantikan strip "—" ketika sebuah besaran memang tidak ada,
// bukan gagal dimuat. Strip telanjang tidak membedakan "nol", "belum termuat",
// dan "memang tidak ada" — tiga hal yang sangat berbeda bagi pembaca pemula.
// Teksnya dirender lebih kecil dan meredup supaya tidak menyamar sebagai angka.
function Metric({
  label,
  value,
  tone = 'text-text-primary',
  hint,
  absent,
  glossary,
}: {
  label: string;
  value: string | null;
  tone?: string;
  hint?: string;
  absent?: string;
  /** Kunci kamus istilah; bila diisi, label mendapat tooltip penjelasan. */
  glossary?: string;
}) {
  return (
    // `flex h-full flex-col` + judul yang memesan dua baris: tanpa keduanya,
    // angka pada kartu berjudul satu baris naik sebaris lebih tinggi daripada
    // tetangganya yang berjudul dua baris, dan deretannya terbaca tidak rata.
    // Angka didorong ke dasar kartu agar sejajar di seluruh kisi.
    <div className="flex h-full flex-col rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8" title={hint}>
      <span className="block min-h-[32px] font-body-sm text-body-sm text-text-muted">
        {glossary ? <GlossaryTerm term={glossary}>{label}</GlossaryTerm> : label}
      </span>
      {value !== null ? (
        <span className={`mt-auto font-label-mono-lg text-label-mono-lg font-bold tabular-nums ${tone}`}>{value}</span>
      ) : (
        <span className="mt-auto font-body-sm text-body-sm text-text-muted">{absent ?? 'Tidak tersedia'}</span>
      )}
    </div>
  );
}

/**
 * The mockup's identity header. Two of its elements are deliberately not
 * reproduced: the "SKOR STOCKET AI — STRONG BUY (92/100)" badge and the
 * consensus buy/sell counters. Both are investment recommendations, which the
 * hackathon's code of conduct and PRD B-02 forbid outright. The Skor Komposit
 * takes that slot instead: same visual weight, but a percentile against peers
 * with no action implied.
 */
export function EmitenIdentityCard({ symbol, peer, score, extras, bars }: Props) {
  const last = bars[bars.length - 1];
  const price = extras?.lastClosePrice ?? last?.close ?? null;
  const change = extras?.dailyCloseChange ?? null;
  const marketCap = last?.marketCap ?? null;
  const positive = (change ?? 0) >= 0;
  const t = score?.score !== null && score?.score !== undefined ? tier(score.score) : null;

  return (
    <div className="rounded border border-border-subtle bg-surface-card px-space-16 py-space-20">
      <div className="flex flex-col gap-space-16 xl:flex-row xl:items-center xl:justify-between">
        {/* Identity. `min-w-0` wajib: tanpanya blok ini memakai lebar
            alaminya, dan nama sepanjang "PT Bank Rakyat Indonesia (Persero)
            Tbk" mendorong kelompok harga+skor di kanan sampai terpaksa
            membungkus, sehingga kartu skor jatuh ke bawah harga pada BBRI
            padahal duduk di sampingnya pada BBCA. */}
        <div className="flex min-w-0 flex-1 items-start gap-space-12">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-border-subtle bg-surface-container">
            <span className="font-headline-md text-headline-md font-bold text-primary">{symbol.slice(0, 3).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">{peer?.companyName ?? symbol.toUpperCase()}</h1>
            <div className="mt-space-6 flex flex-wrap items-center gap-space-6 font-label-mono-sm text-label-mono-sm">
              <span className="rounded bg-surface-container px-space-6 py-space-2 font-bold text-primary">{symbol.toUpperCase().replace(/\.JK$/, '')}.JK</span>
              {peer?.subSector && (
                <span className="rounded border border-border-subtle bg-surface-container-lowest px-space-6 py-space-2 text-text-secondary">
                  Sub-sektor: {peer.subSector}
                </span>
              )}
              {peer?.groupSize !== undefined && (
                <span className="rounded border border-border-subtle bg-surface-container-lowest px-space-6 py-space-2 text-text-muted">
                  {peer.groupSize} emiten sejenis
                </span>
              )}
            </div>
          </div>
        </div>

        <Sparkline bars={bars} positive={positive} />

        {/* Price + composite score. Dulu `flex-wrap`, sehingga kartu skor
            membungkus ke bawah harga begitu ruangnya sempit — tampilan yang
            berbeda antar-emiten hanya karena panjang namanya berbeda. Kini
            keduanya satu kelompok yang tidak pernah pecah: yang menyusut
            adalah blok harga di kirinya (`min-w-0`), dan bila memang tidak
            muat, seluruh kelompok ini yang turun ke baris baru — bersama-sama. */}
        {/* `items-center`, bukan `items-start`: blok harga hanya setinggi 76
            piksel sementara kartu skor di sebelahnya 115 piksel, sehingga
            dengan perataan atas harga tampak melayang jauh di atas pusat
            kartu skor. Ditengahkan, keduanya terbaca sebagai satu pasangan. */}
        <div className="flex min-w-0 items-center gap-space-16">
          <div className="min-w-0">
            <span className="block font-table-header text-table-header uppercase text-text-muted">Harga penutupan terakhir</span>
            <div className="mt-space-2 flex items-baseline gap-space-8">
              <span className="font-display-lg text-display-lg tracking-tight text-text-primary">
                {price !== null ? `Rp ${price.toLocaleString('id-ID')}` : '—'}
              </span>
              {change !== null && (
                <span
                  className={`inline-flex items-center gap-space-2 rounded px-space-6 py-space-2 font-label-mono-md text-label-mono-md font-bold tabular-nums ${
                    positive ? 'bg-state-positive/10 text-state-positive' : 'bg-state-negative/10 text-state-negative'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{positive ? 'trending_up' : 'trending_down'}</span>
                  {positive ? '+' : ''}
                  {(change * 100).toFixed(2)}%
                </span>
              )}
            </div>
            {extras?.latestCloseDate && (
              <span className="mt-space-2 block font-label-mono-sm text-label-mono-sm text-text-muted">
                Per {extras.latestCloseDate} &middot; data penutupan harian, bukan harga real-time
              </span>
            )}
          </div>

          {/* Replaces the mockup's "STRONG BUY (92/100)" badge. */}
          <div className="shrink-0 rounded border border-border-subtle bg-surface-container-lowest p-space-12">
            <GlossaryTerm term="Skor Komposit" className="block font-table-header text-table-header uppercase text-text-muted">
              Skor Komposit Fundamental
            </GlossaryTerm>
            {score?.score !== null && score?.score !== undefined && t ? (
              <div className="mt-space-4 flex items-baseline gap-space-8">
                <span className={`font-display-lg text-display-lg tracking-tight tabular-nums ${t.text}`}>{score.score.toFixed(0)}</span>
                <span className="font-label-mono-md text-label-mono-md text-text-muted">/100</span>
                <span className={`rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${t.chip}`}>{t.label}</span>
              </div>
            ) : (
              <p className="mt-space-4 font-body-sm text-body-sm text-text-muted">Data tidak memadai untuk diberi skor.</p>
            )}
            <span className="mt-space-2 block font-label-mono-sm text-label-mono-sm text-text-muted">
              Rata-rata <GlossaryTerm term="Persentil">persentil</GlossaryTerm> terhadap emiten satu{' '}
              <GlossaryTerm term="Sub-sektor">sub-sektor</GlossaryTerm>
            </span>
          </div>
        </div>
      </div>

      {/* Key multiples */}
      <div className="mt-space-20 grid grid-cols-2 gap-space-8 border-t border-border-subtle pt-space-16 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Kapitalisasi Pasar" glossary="Kapitalisasi Pasar" value={marketCap !== null ? formatIdrCompact(marketCap) : null} />
        <Metric
          label={`P/E Ratio${extras?.year ? ` (${extras.year})` : ''}`}
          glossary="P/E Ratio"
          // `pe > 0` bukan sekadar penjagaan nilai kosong. Sectors mengirim
          // P/E negatif untuk emiten yang merugi — VKTR misalnya, -2527x — dan
          // menampilkannya sebagai angka membuat pembaca menyangka sahamnya
          // sangat murah. Yang benar: rasio ini memang tidak punya arti ketika
          // labanya negatif, persis seperti bunyi definisinya di glosarium.
          value={extras?.pe !== null && extras?.pe !== undefined && extras.pe > 0 ? `${extras.pe.toFixed(2)}x` : null}
          hint="Harga saham dibanding laba bersih per saham"
          absent="Tidak bermakna — laba negatif"
        />
        <Metric
          label="Rata-rata P/E peer"
          glossary="Rata-rata P/E peer"
          value={extras?.pePeerAvg !== null && extras?.pePeerAvg !== undefined ? `${extras.pePeerAvg.toFixed(2)}x` : null}
          tone="text-text-secondary"
          hint="Rata-rata P/E emiten sejenis pada tahun buku yang sama"
        />
        <Metric
          label="PBV Ratio"
          glossary="PBV"
          value={extras?.pb !== null && extras?.pb !== undefined ? `${extras.pb.toFixed(2)}x` : null}
          hint="Harga saham dibanding nilai buku ekuitas per saham"
        />
        <Metric
          label="Dividend Yield (TTM)"
          glossary="Dividend Yield"
          value={
            extras?.dividendYieldTtm !== null && extras?.dividendYieldTtm !== undefined
              ? `${(extras.dividendYieldTtm * 100).toFixed(2)}%`
              : null
          }
          tone="text-state-positive"
          hint="Dividen 12 bulan terakhir dibanding harga saham"
          // Diperiksa pada SAFE dan BUMI: seluruh section dividend dari Sectors
          // bernilai null, termasuk historical_dividends — jadi ini benar-benar
          // "tidak ada riwayat", bukan satu medan yang kebetulan kosong.
          absent="Tidak ada riwayat dividen"
        />
      </div>
    </div>
  );
}
