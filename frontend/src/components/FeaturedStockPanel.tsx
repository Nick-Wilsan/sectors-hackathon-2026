import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAnomaly,
  getCandlestickPatterns,
  getDailyPrices,
  getFramework,
  getFundamentalExtras,
  getIndicators,
  getPeerComparison,
} from '../api/client';
import { loadCompanyIndex } from '../api/companyIndex';
import type { AnomalyResult, CandlestickResult, CompanyLite, DailyBar, FrameworkResult, FundamentalExtras, IndicatorResult, PatternCategory, PeerComparisonResult, TickerTapeRow } from '../api/types';
import { PriceChart } from './PriceChart';
import { PatternSimilarityPanel } from './PatternSimilarityPanel';
import { ScoreBar } from './ScoreBar';
import { GlossaryTerm } from './GlossaryTerm';

// Dashboard preview of the reference mockup's "Analisis Interaktif TradingView
// — BBCA" section. Reuses the exact same data this app already computes for
// the full /emiten/:symbol page (F-01 score via peer comparison, F-07
// candlestick patterns, F-08 indicators, F-05 AI explainer) — no new backend
// logic, just a second, lighter presentation of real data.
//
// Three slots in the mockup couldn't be ported honestly and were replaced:
//   - "Order Book (Depth)"      -> Peer Comparison (order book data doesn't
//                                   exist in the Sectors API)
//   - "Ringkasan Teknis Pemula" -> real candlestick-pattern tally, neutral
//                                   labels (the mockup's gauge said "Beli
//                                   Kuat"/"STRONG BUY" — investment-advice
//                                   language the PRD's B-02 forbids)
//   - "Sentimen Pasar & AI ..."  -> a structured recap built from real data
//                                   already fetched (score, peer rank and its
//                                   neighbors, volume/change, anomaly status)
//                                   — a Gemini paragraph here would only have
//                                   restated the same facts in prose, so it
//                                   was dropped rather than kept as filler
const FEATURED_SYMBOL = 'BBCA';

// Kunci kamus istilah per komponen skor. Dipisah dari label tampilan karena
// keduanya memang berbeda: label berbunyi "Profitabilitas Modal (ROE)"
// sementara kamus berkunci "ROE (Return on Equity)".
const GLOSARIUM_KOMPONEN: Record<string, string> = {
  roe: 'ROE',
  netProfitMargin: 'Margin laba',
  der: 'DER',
  ocfMargin: 'Margin Arus Kas Operasional',
  roa: 'ROA',
};
const RANGE_OPTIONS = [
  { days: 30, label: '1 Bln' },
  { days: 90, label: '3 Bln' },
] as const;

// Percentile-driven color for a fundamental metric value (reuses the same
// 66/33 tiers as ScoreBar/sector cards) — real signal, not decoration: a
// value only reads green when this company actually ranks well on it among
// its sub-sector peers.
function tierTextColor(percentile: number): string {
  if (percentile >= 66) return 'text-state-positive';
  if (percentile >= 33) return 'text-state-warning';
  return 'text-state-negative';
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-space-4 rounded px-space-6 py-space-2 font-label-mono-md text-label-mono-md font-bold ${
        positive ? 'bg-state-positive/10 text-state-positive' : 'bg-state-negative/10 text-state-negative'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{positive ? 'trending_up' : 'trending_down'}</span>
      {positive ? '+' : ''}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

function PatternTallyCard({ candlestick }: { candlestick: CandlestickResult | null }) {
  const tally = useMemo(() => {
    // Setiap kategori harus punya kunci di sini. Saat kategori 'continuation'
    // ditambahkan di backend, obyek tanpa kuncinya membuat penambahan bekerja
    // pada undefined dan seluruh hitungan menjadi NaN — Record<> memaksa
    // TypeScript menangkapnya bila kategori baru muncul lagi nanti.
    const counts: Record<PatternCategory, number> = {
      'reversal-bullish': 0,
      'reversal-bearish': 0,
      continuation: 0,
      indecision: 0,
    };
    for (const m of candlestick?.matches ?? []) counts[m.category]++;
    return counts;
  }, [candlestick]);

  const total = tally['reversal-bullish'] + tally['reversal-bearish'] + tally.continuation + tally.indecision;

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-12">
      <div className="mb-space-8 flex items-center justify-between border-b border-border-subtle pb-space-6">
        <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Pola Candlestick Terdeteksi</h3>
        <span className="font-label-mono-sm text-label-mono-sm text-text-muted">90 hari</span>
      </div>
      {total === 0 ? (
        <p className="font-body-sm text-body-sm text-text-muted">Belum ada pola candlestick terdeteksi pada periode ini.</p>
      ) : (
        <div className="flex flex-col gap-space-8">
          <div className="flex h-2 overflow-hidden rounded-full bg-surface-container">
            {tally['reversal-bullish'] > 0 && (
              <div className="h-full bg-state-positive" style={{ width: `${(tally['reversal-bullish'] / total) * 100}%` }} />
            )}
            {tally.continuation > 0 && (
              <div className="h-full bg-primary-container" style={{ width: `${(tally.continuation / total) * 100}%` }} />
            )}
            {tally.indecision > 0 && <div className="h-full bg-state-warning" style={{ width: `${(tally.indecision / total) * 100}%` }} />}
            {tally['reversal-bearish'] > 0 && (
              <div className="h-full bg-state-negative" style={{ width: `${(tally['reversal-bearish'] / total) * 100}%` }} />
            )}
          </div>
          {/* Label sengaja menyebut BENTUK polanya, bukan arah pasar. Versi
              sebelumnya berbunyi "Bullish / Netral / Bearish" pada tiga angka
              besar berwarna — secara visual nyaris identik dengan elemen mockup
              yang dilarang, "Sinyal Konsensus: SANGAT BELI 16/5/1", dan mudah
              terbaca sebagai pandangan produk atas arah harga. Yang dihitung
              sebenarnya hanya berapa kali tiap keluarga pola muncul. */}
          <div className="grid grid-cols-2 gap-space-8 font-label-mono-sm text-label-mono-sm sm:grid-cols-4">
            <div>
              <div className="font-bold text-state-positive">{tally['reversal-bullish']}</div>
              <div className="leading-tight text-text-muted">Pola pembalikan ke atas</div>
            </div>
            <div>
              <div className="font-bold text-primary">{tally.continuation}</div>
              <div className="leading-tight text-text-muted">Pola penguasaan satu sisi</div>
            </div>
            <div>
              <div className="font-bold text-state-warning">{tally.indecision}</div>
              <div className="leading-tight text-text-muted">Pola keraguan</div>
            </div>
            <div>
              <div className="font-bold text-state-negative">{tally['reversal-bearish']}</div>
              <div className="leading-tight text-text-muted">Pola pembalikan ke bawah</div>
            </div>
          </div>
        </div>
      )}
      <p className="mt-space-8 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        Hitungan kemunculan pola pada 90 hari terakhir — bukan sinyal beli/jual dan bukan perkiraan arah harga. Lihat{' '}
        <Link to={`/emiten/${FEATURED_SYMBOL}`} className="text-primary hover:text-accent-hover">
          analisis lengkap
        </Link>{' '}
        untuk definisi tiap pola.
      </p>
    </div>
  );
}

/** Nama host penerbit dari URL artikel, untuk ditampilkan menggantikan URL mentah. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'sumber';
  }
}

// Real prices for other blue-chip symbols — reuses the ticker-tape data the
// dashboard already fetched (App.tsx's header strip), so this costs nothing
// extra, plus the company-name index already loaded for the search box.
function WatchlistCard({ tickerTape, companies }: { tickerTape: TickerTapeRow[]; companies: CompanyLite[] }) {
  const nameBySymbol = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) map.set(c.symbol.replace('.JK', ''), c.companyName);
    return map;
  }, [companies]);

  const rows = tickerTape.filter((r) => r.symbol !== FEATURED_SYMBOL && r.price !== null).slice(0, 4);
  if (rows.length === 0) return null;

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-12">
      <div className="mb-space-6 flex items-center justify-between border-b border-border-subtle pb-space-6">
        <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Watchlist Emiten Relevan</h3>
      </div>
      <div className="flex flex-col gap-space-4">
        {rows.map((r) => {
          const positive = (r.change ?? 0) >= 0;
          return (
            <Link
              key={r.symbol}
              to={`/emiten/${r.symbol}`}
              className="flex items-center justify-between rounded p-space-6 transition-colors hover:bg-surface-container"
            >
              <div>
                <span className="block font-headline-sm text-headline-sm font-bold text-text-primary">{r.symbol}</span>
                <p className="font-body-sm text-body-sm text-text-muted">{nameBySymbol.get(r.symbol) ?? ''}</p>
              </div>
              <div className="text-right">
                <span className="block font-label-mono-md text-label-mono-md text-text-primary">Rp {r.price!.toLocaleString('id-ID')}</span>
                {r.change !== null && (
                  <span className={`font-label-mono-sm text-label-mono-sm font-semibold ${positive ? 'text-state-positive' : 'text-state-negative'}`}>
                    {positive ? '+' : ''}
                    {(r.change * 100).toFixed(2)}%
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PeerCard({ peer }: { peer: PeerComparisonResult | null }) {
  if (!peer) return null;
  const topPeers = peer.peers.filter((p) => p.symbol !== `${FEATURED_SYMBOL}.JK`).slice(0, 5);

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-12">
      <div className="mb-space-8 flex items-center justify-between border-b border-border-subtle pb-space-6">
        <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Perbandingan Peer</h3>
        <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{peer.subSector}</span>
      </div>
      <div className="flex flex-col gap-space-8">
        {topPeers.map((p) => (
          <Link key={p.symbol} to={`/emiten/${p.symbol.replace('.JK', '')}`} className="block hover:opacity-80">
            <ScoreBar value={p.score ?? 0} label={p.symbol.replace('.JK', '')} />
          </Link>
        ))}
        {topPeers.length === 0 && <p className="font-body-sm text-body-sm text-text-muted">Tidak ada peer sebanding.</p>}
      </div>
    </div>
  );
}

export function FeaturedStockPanel({ tickerTape = [] }: { tickerTape?: TickerTapeRow[] }) {
  const [peer, setPeer] = useState<PeerComparisonResult | null>(null);
  const [candlestick, setCandlestick] = useState<CandlestickResult | null>(null);
  const [indicators, setIndicators] = useState<IndicatorResult | null>(null);
  const [bars, setBars] = useState<DailyBar[]>([]);
  const [anomaly, setAnomaly] = useState<AnomalyResult | null>(null);
  const [extras, setExtras] = useState<FundamentalExtras | null>(null);
  const [framework, setFramework] = useState<FrameworkResult | null>(null);
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [rangeDays, setRangeDays] = useState<30 | 90>(90);

  useEffect(() => {
    // Deliberately uncapped (same call the real /emiten/BBCA page makes) —
    // capping this to a smaller peer group would compute a DIFFERENT score
    // for BBCA here than on its own detail page, which breaks the PRD's
    // consistency requirement. The full ~48-company Banks fetch this implies
    // is cached 24h (file cache, shared across all requests), so it's a
    // bounded once-a-day cost, not a per-visit one.
    getPeerComparison(FEATURED_SYMBOL).then(setPeer).catch(() => {});
    getCandlestickPatterns(FEATURED_SYMBOL).then(setCandlestick).catch(() => {});
    getIndicators(FEATURED_SYMBOL).then(setIndicators).catch(() => {});
    getDailyPrices(FEATURED_SYMBOL)
      .then((d) => setBars(d.bars))
      .catch(() => {});
    // Real related-news list (reuses F-06's anomaly-linked news) — an honest
    // substitute for the mockup's fabricated sentiment feed.
    getAnomaly(FEATURED_SYMBOL).then(setAnomaly).catch(() => {});
    getFundamentalExtras(FEATURED_SYMBOL).then(setExtras).catch(() => {});
    getFramework(FEATURED_SYMBOL).then(setFramework).catch(() => {});
    // Already loaded module-wide for the header search box — free reuse.
    loadCompanyIndex().then(setCompanies).catch(() => {});
  }, []);

  const visibleBars = useMemo(() => bars.slice(-rangeDays), [bars, rangeDays]);
  const last = visibleBars[visibleBars.length - 1];
  const prev = visibleBars[visibleBars.length - 2];
  const change = last && prev && prev.close ? (last.close - prev.close) / prev.close : null;

  const rangeLabel = RANGE_OPTIONS.find((o) => o.days === rangeDays)?.label;
  const scoreComponent = peer?.metrics ?? [];
  const compositeScore = peer?.status !== 'inadequate' ? scoreComponent.reduce((s, c) => s + c.percentile * c.weightUsed, 0) : null;

  const peerRank = useMemo(() => {
    if (!peer) return null;
    const ranked = peer.peers.filter((p) => p.score !== null).sort((a, b) => b.score! - a.score!);
    const index = ranked.findIndex((p) => p.symbol === `${FEATURED_SYMBOL}.JK`);
    if (index === -1) return null;
    // Computed directly from the peer list we already have — no AI call
    // needed just to name the two neighbors in the ranking.
    return {
      position: index + 1,
      total: ranked.length,
      above: index > 0 ? ranked[index - 1] : null,
      below: index < ranked.length - 1 ? ranked[index + 1] : null,
    };
  }, [peer]);

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-8 border-b border-border-subtle pb-space-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-space-12">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-border-subtle bg-surface-container">
            <span className="font-headline-md text-headline-md font-bold text-primary">{FEATURED_SYMBOL.slice(0, 3)}</span>
          </div>
          <div>
            <div className="flex items-center gap-space-8">
              <h2 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">
                Sorotan Emiten — {FEATURED_SYMBOL}
              </h2>
              <span className="rounded border border-border-subtle bg-surface-container px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm text-text-secondary">
                IDX:{FEATURED_SYMBOL}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary">
              {peer?.companyName ?? 'PT Bank Central Asia Tbk'} &middot; Sektor {peer?.subSector ?? 'Keuangan'}
            </p>
          </div>
        </div>
        {/* Dulu di sini ada dua tombol nonaktif, Simpan Watchlist dan Buat Price
            Alert. Keduanya butuh akun dan pengiriman notifikasi yang tidak ada
            di produk ini, jadi selamanya akan mati — dan tombol mati terbaca
            sebagai prototipe setengah jadi. Digantikan satu aksi yang memang
            bekerja: melanjutkan ke analisis lengkap emiten yang sedang disorot. */}
        <div className="flex items-center gap-space-8">
          <Link
            to={`/emiten/${FEATURED_SYMBOL}`}
            className="flex items-center gap-space-6 rounded bg-primary-container px-space-16 py-space-8 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover"
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            Analisis lengkap {FEATURED_SYMBOL}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-8 xl:grid-cols-12">
        <div className="flex flex-col overflow-hidden rounded border border-border-subtle bg-surface-card xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-space-8 p-space-12 pb-space-8">
            <div className="flex items-baseline gap-space-8">
              <span className="font-headline-lg text-headline-lg font-bold text-text-primary">
                {last ? `Rp ${last.close.toLocaleString('id-ID')}` : '—'}
              </span>
              {change !== null && <ChangeBadge value={change} />}
              {last && <span className="font-label-mono-sm text-label-mono-sm text-text-muted">Vol: {(last.volume / 1e6).toFixed(1)} jt</span>}
            </div>
            <div className="flex items-center gap-space-8">
              <div className="inline-flex rounded border border-border-subtle bg-background-base p-space-2 font-label-mono-sm text-label-mono-sm">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setRangeDays(opt.days)}
                    className={`rounded px-space-8 py-space-2 transition-colors ${
                      rangeDays === opt.days ? 'bg-surface-container font-bold text-primary-container' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Link
                to={`/emiten/${FEATURED_SYMBOL}`}
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 font-body-sm text-body-sm text-text-secondary transition-colors hover:border-surface-variant hover:text-text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_full</span> Analisis Penuh
              </Link>
            </div>
          </div>
          {/* Pure page-background black behind the chart itself (header/footer keep
              the card's surface-card tone) — matches the rest of the app's chart
              treatment instead of the lighter card tone bleeding into the plot. */}
          <div className="h-[460px] bg-background-base">
            {visibleBars.length > 0 && (
              // Deliberately no `patterns` here — chart stays a clean price/MA/RSI
              // read, matching the reference screenshot; the candlestick-pattern
              // tally still shows in its own card instead of cluttering the chart.
              <PriceChart bars={visibleBars} movingAverages={indicators?.movingAverages ?? []} rsi={indicators?.rsi ?? null} />
            )}
          </div>
          <p className="p-space-12 pt-space-4 font-label-mono-sm text-label-mono-sm text-text-muted">
            Rentang {rangeLabel} · MA 20/50 &amp; RSI 14 — untuk alat gambar &amp; kontrol indikator penuh, buka halaman analisis.
          </p>
        </div>

        <div className="flex flex-col gap-space-8 xl:col-span-4">
          <PeerCard peer={peer} />
          <PatternTallyCard candlestick={candlestick} />
          <WatchlistCard tickerTape={tickerTape} companies={companies} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16 lg:col-span-7">
          <div>
            <div className="mb-space-12 flex items-center justify-between border-b border-border-subtle pb-space-8">
              <div className="flex items-center gap-space-6">
                <span className="material-symbols-outlined text-[18px] text-primary-container">verified</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
                  Matriks Fundamental {FEATURED_SYMBOL} (Tahun Terakhir)
                </h3>
              </div>
              {compositeScore !== null && (
                <span className="font-label-mono-sm text-label-mono-sm font-bold text-state-positive">
                  Kesehatan: {compositeScore.toFixed(0)}/100
                </span>
              )}
            </div>
            {scoreComponent.length > 0 ? (
              <div className="grid grid-cols-2 gap-space-8 sm:grid-cols-3 lg:grid-cols-5">
                {scoreComponent.map((c) => (
                  <div key={c.key} className="rounded border border-border-subtle/50 bg-surface-container-lowest p-space-8">
                    <span className="block font-body-sm text-body-sm text-text-muted">
                      <GlossaryTerm term={GLOSARIUM_KOMPONEN[c.key] ?? c.label}>{c.label}</GlossaryTerm>
                    </span>
                    <span className={`block font-label-mono-lg text-label-mono-lg font-bold ${tierTextColor(c.percentile)}`}>
                      {/* der is already a ratio (e.g. 4.63x); every other component is a fraction
                          from the API (0.2043 = 20.43%) and needs scaling for display. */}
                      {c.key === 'der' ? `${c.rawValue.toFixed(2)}x` : `${(c.rawValue * 100).toFixed(2)}%`}
                    </span>
                    <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">
                      Persentil {c.percentile.toFixed(0)}
                    </span>
                  </div>
                ))}
                {extras?.pe !== null && extras?.pe !== undefined && (
                  <div className="rounded border border-border-subtle/50 bg-surface-container-lowest p-space-8">
                    <span className="block font-body-sm text-body-sm text-text-muted">
                      <GlossaryTerm term="P/E Ratio">P/E Ratio</GlossaryTerm>
                    </span>
                    <span className="block font-label-mono-lg text-label-mono-lg font-bold text-text-primary">{extras.pe.toFixed(1)}x</span>
                    {extras.pePeerAvg !== null && (
                      <span className="block font-label-mono-sm text-label-mono-sm text-state-warning">Avg peer: {extras.pePeerAvg.toFixed(1)}x</span>
                    )}
                  </div>
                )}
                {extras?.pb !== null && extras?.pb !== undefined && (
                  <div className="rounded border border-border-subtle/50 bg-surface-container-lowest p-space-8">
                    <span className="block font-body-sm text-body-sm text-text-muted">
                      <GlossaryTerm term="PBV">PBV Ratio</GlossaryTerm>
                    </span>
                    <span className="block font-label-mono-lg text-label-mono-lg font-bold text-text-primary">{extras.pb.toFixed(1)}x</span>
                  </div>
                )}
                {extras?.dividendYieldTtm !== null && extras?.dividendYieldTtm !== undefined && (
                  <div className="rounded border border-border-subtle/50 bg-surface-container-lowest p-space-8">
                    <span className="block font-body-sm text-body-sm text-text-muted">
                      <GlossaryTerm term="Dividend Yield">Dividend Yield (TTM)</GlossaryTerm>
                    </span>
                    <span className="block font-label-mono-lg text-label-mono-lg font-bold text-state-positive">
                      {(extras.dividendYieldTtm * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-text-muted">Data fundamental belum tersedia.</p>
            )}
          </div>
          {(extras?.casaRatio || extras?.costToIncomeRatio) && (
            <div className="mt-space-8 flex flex-wrap items-center justify-between gap-space-8 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
              {extras.casaRatio !== null && (
                <span>
                  <GlossaryTerm term="CASA">CASA Ratio</GlossaryTerm>: <strong className="text-state-positive">{(extras.casaRatio * 100).toFixed(1)}%</strong>
                </span>
              )}
              {extras.costToIncomeRatio !== null && (
                <span title="Substitusi jujur untuk NPL Gross — Sectors API tidak menyediakan data NPL sama sekali">
                  <GlossaryTerm term="Cost-to-Income Ratio">Cost-to-Income Ratio</GlossaryTerm>: <strong className="text-text-primary">{(extras.costToIncomeRatio * 100).toFixed(1)}%</strong>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded border border-border-subtle bg-surface-card p-space-16 lg:col-span-5">
          <div>
            <div className="mb-space-12 flex items-center justify-between border-b border-border-subtle pb-space-8">
              <div className="flex items-center gap-space-6">
                <span className="material-symbols-outlined text-[18px] text-primary">summarize</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Ringkasan Performa {FEATURED_SYMBOL}</h3>
              </div>
            </div>
            {/* Structured recap built entirely from real data already in state —
                no AI call: everything here (score, rank, neighbors, volume,
                anomaly) is directly computable, so there was nothing left for a
                Gemini paragraph to add once these existed — it was just
                restating the same facts in prose. */}
            <ul className="mb-space-12 flex flex-col gap-space-8 font-body-sm text-body-sm text-text-secondary">
              {compositeScore !== null && (
                <li className="flex gap-space-6">
                  <span className="mt-space-6 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                  <span>
                    Skor Komposit {FEATURED_SYMBOL} tercatat{' '}
                    <strong className={tierTextColor(compositeScore)}>{compositeScore.toFixed(1)}</strong>.
                    {framework && framework.status !== 'inadequate' && (
                      <>
                        {' '}
                        F-Score Piotroski: <strong className="text-state-warning">{framework.classification}</strong>
                      </>
                    )}
                  </span>
                </li>
              )}
              {peerRank && peer && (
                <li className="flex gap-space-6">
                  <span className="mt-space-6 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                  <span>
                    Berada di peringkat <strong className="text-primary-container">{peerRank.position}</strong> dari{' '}
                    <strong className="text-primary-container">{peerRank.total}</strong> anggota sub-sektor {peer.subSector}
                    {(peerRank.above || peerRank.below) && (
                      <>
                        , di antara{' '}
                        {peerRank.above && (
                          <Link to={`/emiten/${peerRank.above.symbol.replace('.JK', '')}`} className="text-state-positive hover:text-accent-hover">
                            {peerRank.above.companyName}
                          </Link>
                        )}
                        {peerRank.above && peerRank.below && ' dan '}
                        {peerRank.below && (
                          <Link to={`/emiten/${peerRank.below.symbol.replace('.JK', '')}`} className="text-state-negative hover:text-accent-hover">
                            {peerRank.below.companyName}
                          </Link>
                        )}
                      </>
                    )}
                    {/* No forced trailing period — some Indonesian company names already end in "Tbk.", which would otherwise double up. */}
                  </span>
                </li>
              )}
              {last && change !== null && (
                <li className="flex gap-space-6">
                  <span className="mt-space-6 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                  <span>
                    Volume hari ini <strong className="text-state-warning">{last.volume.toLocaleString('id-ID')}</strong> lembar, perubahan harga{' '}
                    <strong className={change >= 0 ? 'text-state-positive' : 'text-state-negative'}>
                      {change >= 0 ? '+' : ''}
                      {(change * 100).toFixed(2)}%
                    </strong>
                    .
                  </span>
                </li>
              )}
              {anomaly && anomaly.status !== 'inadequate' && (
                <li className="flex gap-space-6">
                  <span className="mt-space-6 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                  <span>
                    Deteksi anomali:{' '}
                    <span
                      className={`rounded border px-space-4 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${
                        anomaly.hasAnomaly
                          ? 'border-state-warning/40 bg-state-warning/10 text-state-warning'
                          : 'border-state-positive/40 bg-state-positive/10 text-state-positive'
                      }`}
                    >
                      {anomaly.hasAnomaly ? 'Anomali terdeteksi' : 'Tidak ada anomali'}
                    </span>
                  </span>
                </li>
              )}
            </ul>
            {anomaly && anomaly.relatedNews.length > 0 && (
              <div className="mt-space-12 flex flex-col gap-space-8 border-t border-border-subtle pt-space-8">
                {anomaly.relatedNews.slice(0, 2).map((n, i) => (
                  // Dulu href="#" dengan preventDefault: terlihat bisa diklik
                  // tetapi tidak menuju ke mana pun. `source` pada data berita
                  // Sectors berisi URL artikel aslinya, jadi kartunya kini
                  // benar-benar membuka penerbitnya, dan yang ditampilkan adalah
                  // nama host-nya, bukan URL mentah.
                  <a
                    key={i}
                    href={n.source}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8 transition-colors hover:border-surface-variant"
                  >
                    <div className="mb-space-2 flex items-center justify-between font-label-mono-sm text-label-mono-sm">
                      <span className="truncate font-semibold text-primary">{hostOf(n.source)}</span>
                      <span className="text-text-muted">
                        {Math.max(1, Math.round((Date.now() - new Date(n.timestamp).getTime()) / 3_600_000))}j lalu
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-[13px] font-bold leading-tight text-text-primary">{n.title}</h4>
                  </a>
                ))}
              </div>
            )}
          </div>
          <p className="mt-space-8 border-t border-border-subtle pt-space-8 font-label-mono-sm text-label-mono-sm text-text-muted">
            Dihasilkan oleh Gemini dari data fundamental &amp; harga real — bukan rekomendasi investasi.
          </p>
        </div>
      </div>

      <PatternSimilarityPanel symbol={FEATURED_SYMBOL} variant="card" />
    </div>
  );
}
