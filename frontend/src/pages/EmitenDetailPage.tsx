import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getAnomaly,
  getCandlestickPatterns,
  getCompositeScore,
  getDailyPrices,
  getFramework,
  getFundamentalExtras,
  getCompanyProfile,
  getIndicators,
  getPeerComparison,
  askAboutEmiten,
} from '../api/client';
import type {
  AnomalyResult,
  CandlestickResult,
  ComponentScoreDetail,
  CompositeScoreResult,
  DailyBar,
  FrameworkResult,
  FundamentalExtras,
  IndicatorResult,
  PeerComparisonResult,
  CompanyProfile,
} from '../api/types';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { PriceChart, type ChartType, type DrawingTool, type ReadoutBar, type Measurement } from '../components/PriceChart';
import { PatternPicker } from '../components/PatternPicker';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { IndicatorSettings } from '../components/IndicatorSettings';
import { PatternSimilarityPanel } from '../components/PatternSimilarityPanel';
import { ChartToolbar, type RangeDays } from '../components/ChartToolbar';
import { ChartReadout } from '../components/ChartReadout';
import { DrawingToolbar } from '../components/DrawingToolbar';
import { FloatingAIChat } from '../components/FloatingAIChat';
import { EmitenIdentityCard } from '../components/EmitenIdentityCard';
import { EmitenAnswerCard } from '../components/EmitenAnswerCard';
import { SectionNav, type SectionLink } from '../components/SectionNav';
import { SectorContextPanel } from '../components/SectorContextPanel';
import { ValuationHistoryTable } from '../components/ValuationHistoryTable';
import { FinancialStatementsPanel } from '../components/FinancialStatementsPanel';
import { CompanyProfilePanel } from '../components/CompanyProfilePanel';
import { EmitenNewsPanel } from '../components/EmitenNewsPanel';
import { FScorePanel } from '../components/FScorePanel';
import { PriceStatsPanel } from '../components/PriceStatsPanel';
import { PeerDataWarning } from '../components/PeerDataWarning';
import { AnomalyPanel } from '../components/AnomalyPanel';

const RANGE_LABEL: Record<number, string> = { 5: '5 hari', 30: '1 bulan', 90: '3 bulan' };

const STATUS_LABEL: Record<CompositeScoreResult['status'], string> = {
  ok: 'Lengkap',
  partial: 'Sebagian data (1 komponen hilang)',
  inadequate: 'Data tidak memadai',
};

function Panel({
  title,
  icon,
  children,
  action,
  id,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  /** Dipakai sebagai sasaran lompat dari daftar isi dan blok jawaban. */
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-[104px] rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex items-center justify-between gap-space-8 border-b border-border-subtle pb-space-8">
        <div className="flex items-center gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">{icon}</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-space-12">{children}</div>
    </div>
  );
}

// PRD F-05 menuntut penjelasan tersedia untuk SETIAP komponen skor, bukan
// hanya untuk skor gabungannya. Kunci kamus dipisah dari label tampilan karena
// keduanya memang berbeda: label menyebut "Profitabilitas Modal (ROE)"
// sementara kamus berkunci "ROE (Return on Equity)".
/** Nilai mentah satu komponen skor, apa adanya dari laporan emiten.
 *
 *  DER adalah perbandingan (5,45x); empat komponen lain dikirim Sectors sebagai
 *  pecahan (0,1712 = 17,12%). Pembedaan ini sudah ada di FeaturedStockPanel dan
 *  diulang di sini karena keduanya membaca medan yang sama. */
function nilaiAsli(key: string, rawValue: number): string {
  if (key === 'der') return `${rawValue.toFixed(2)}x`;
  return `${(rawValue * 100).toFixed(2)}%`;
}

/** Satu baris pada panel Komponen Skor.
 *
 *  Panel ini sempat menampilkan persis apa yang sudah ada di blok jawaban di
 *  atas — label, persentil, dan bobot yang sama — sehingga pembaca yang sudah
 *  membaca ringkasannya tidak mendapat apa pun di sini. Yang belum terjawab di
 *  mana pun justru pertanyaan berikutnya: peringkat 95 itu angkanya berapa.
 *  `rawValue` sudah ikut terkirim pada permintaan skor dan selama ini tidak
 *  dipakai sama sekali di halaman ini, jadi menampilkannya tidak menambah satu
 *  pun panggilan API. Bobot sengaja tidak diulang di sini; tempatnya sudah di
 *  ringkasan atas bersama penjumlahannya. */
function BarisKomponen({ komponen, glossaryTerm }: { komponen: ComponentScoreDetail; glossaryTerm?: string }) {
  const nada = komponen.percentile >= 66 ? 'bg-state-positive' : komponen.percentile >= 33 ? 'bg-state-warning' : 'bg-state-negative';
  return (
    <div>
      <div className="flex items-baseline justify-between gap-space-8">
        <span className="min-w-0 font-body-md text-body-md text-text-secondary">
          {glossaryTerm ? <GlossaryTerm term={glossaryTerm}>{komponen.label}</GlossaryTerm> : komponen.label}
        </span>
        <span className="shrink-0 font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-text-primary">
          {nilaiAsli(komponen.key, komponen.rawValue)}
        </span>
      </div>
      <div className="mt-space-6 flex items-center gap-space-8">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
          <span className={`block h-full rounded-full ${nada}`} style={{ width: `${Math.max(2, Math.min(100, komponen.percentile))}%` }} />
        </span>
        <span className="shrink-0 font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">
          persentil {komponen.percentile.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

const SCORE_GLOSSARY: Record<string, string> = {
  roe: 'ROE',
  netProfitMargin: 'Margin laba',
  der: 'DER',
  ocfMargin: 'Margin Arus Kas Operasional',
  roa: 'ROA',
};

export function EmitenDetailPage() {
  const { symbol = '' } = useParams();
  const [score, setScore] = useState<CompositeScoreResult | null>(null);
  const [peer, setPeer] = useState<PeerComparisonResult | null>(null);
  const [framework, setFramework] = useState<FrameworkResult | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyResult | null>(null);
  const [bars, setBars] = useState<DailyBar[]>([]);
  const [patterns, setPatterns] = useState<CandlestickResult | null>(null);
  const [indicators, setIndicators] = useState<IndicatorResult | null>(null);
  const [extras, setExtras] = useState<FundamentalExtras | null>(null);
  // Profil memakai section overview yang sudah ter-cache saat skor dihitung,
  // jadi permintaan ini tidak menambah biaya kredit.
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<RangeDays>(90);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const [clearSignal, setClearSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [readout, setReadout] = useState<ReadoutBar | null>(null);
  // Indicators are OFF by default — user turns them on (Technical Spec decision).
  const [showMA, setShowMA] = useState(false);
  const [showRsi, setShowRsi] = useState(false);
  // Pattern markers start OFF so the chart opens clean; the pattern list in
  // the side panel is always there for anyone who wants the detail.
  const [showPatterns, setShowPatterns] = useState(false);
  // Pola mana yang ditandai. `null` berarti semuanya — keadaan awal, sehingga
  // sakelar "Pola" tetap berperilaku persis seperti sebelumnya bagi pembaca
  // yang tidak pernah membuka pemilihnya. Set kosong berarti benar-benar tidak
  // ada; keduanya perlu dibedakan, jadi sentinel bukan pilihan yang benar.
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string> | null>(null);
  // Periode indikator dipilih pengguna; perubahannya memicu pengambilan ulang
  // ke endpoint yang sama, dan seri hariannya sudah ter-cache — 0 kredit.
  const [maPeriods, setMaPeriods] = useState<number[]>([20, 50]);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  // Dinaikkan tiap kali sesuatu di halaman meminta panel AI dibuka. Uji
  // pengguna: peluncur melayang di pojok layar tidak disadari satu pun
  // responden, jadi blok jawaban di atas ikut bisa membukanya.
  const [aiOpenSignal, setAiOpenSignal] = useState(0);

  // Native fullscreen is preferred (it hides browser chrome too), but it is
  // blocked in some embedding contexts and rejects silently. Falling back to an
  // in-page overlay guarantees the control always does something.
  const [expandedInPage, setExpandedInPage] = useState(false);

  async function toggleFullscreen() {
    if (!chartWrapperRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (expandedInPage) {
      setExpandedInPage(false);
      return;
    }
    try {
      await chartWrapperRef.current.requestFullscreen();
    } catch {
      setExpandedInPage(true);
      return;
    }
    // Some embedders resolve the promise without ever entering fullscreen, so
    // the result is checked rather than trusted. Without this the control looks
    // dead: no error, no fullscreen, no fallback.
    await new Promise((r) => setTimeout(r, 120));
    if (!document.fullscreenElement) setExpandedInPage(true);
  }

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Escape leaves the in-page overlay, matching native fullscreen behaviour.
  useEffect(() => {
    if (!expandedInPage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedInPage(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedInPage]);

  // Everything charted (bars, patterns, MA, RSI) is date-keyed (YYYY-MM-DD,
  // lexicographically sortable) — slicing all of them to the same cutoff
  // keeps the visible window consistent without any new API calls.
  const cutoffDate = useMemo(() => {
    const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[Math.max(0, sorted.length - rangeDays)]?.date;
  }, [bars, rangeDays]);

  const visibleBars = useMemo(() => (cutoffDate ? bars.filter((b) => b.date >= cutoffDate) : bars), [bars, cutoffDate]);
  const visiblePatterns = useMemo(
    () => (cutoffDate ? (patterns?.matches ?? []).filter((m) => m.date >= cutoffDate) : (patterns?.matches ?? [])),
    [patterns, cutoffDate],
  );
  // Angka frekuensi harus menghitung jendela yang SEDANG dilihat, bukan
  // seluruh 90 hari: menampilkan "34x" di sebelah nama pola sementara grafik
  // hanya memuat 5 hari akan membuat angkanya berbohong. Definisi, label, dan
  // kelompoknya tetap diambil dari backend.
  const visibleFrequencies = useMemo(() => {
    const semua = patterns?.frequencies ?? [];
    const jumlahBar = visibleBars.length;
    if (jumlahBar === 0) return semua;
    return semua.map((f) => {
      const hits = visiblePatterns.filter((m) => m.key === f.key);
      const pertama = hits[0];
      const terakhir = hits[hits.length - 1];
      return {
        ...f,
        count: hits.length,
        rate: hits.length / jumlahBar,
        averageGapDays: hits.length > 1 ? (terakhir.index - pertama.index) / (hits.length - 1) : null,
        lastDate: terakhir?.date ?? null,
      };
    });
  }, [patterns, visiblePatterns, visibleBars]);

  const chartPatterns = useMemo(() => {
    if (!showPatterns) return [];
    if (selectedPatterns === null) return visiblePatterns;
    return visiblePatterns.filter((m) => selectedPatterns.has(m.key));
  }, [showPatterns, visiblePatterns, selectedPatterns]);
  const visibleMovingAverages = useMemo(() => {
    if (!showMA) return [];
    return (indicators?.movingAverages ?? []).map((ma) => ({
      ...ma,
      points: cutoffDate ? ma.points.filter((p) => p.date >= cutoffDate) : ma.points,
    }));
  }, [indicators, cutoffDate, showMA]);
  const visibleRsi = useMemo(() => {
    if (!showRsi || !indicators?.rsi) return null;
    return { ...indicators.rsi, points: cutoffDate ? indicators.rsi.points.filter((p) => p.date >= cutoffDate) : indicators.rsi.points };
  }, [indicators, cutoffDate, showRsi]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getCompositeScore(symbol),
      getPeerComparison(symbol),
      getFramework(symbol),
      getAnomaly(symbol),
      getDailyPrices(symbol),
      getCandlestickPatterns(symbol),
      getFundamentalExtras(symbol),
    ])
      .then(([s, p, f, a, prices, pat, ex]) => {
        setScore(s);
        setPeer(p);
        setFramework(f);
        setAnomaly(a);
        setBars(prices.bars);
        setPatterns(pat);
        setExtras(ex);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data emiten'))
      .finally(() => setLoading(false));

    // Profil diminta terpisah dari rangkaian utama: isinya pelengkap, sehingga
    // kegagalannya cukup menyembunyikan satu panel, bukan menjatuhkan seluruh
    // halaman analisis.
    setProfile(null);
    getCompanyProfile(symbol)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [symbol]);

  // Indikator diambil terpisah karena periodenya dapat diubah pengguna: hanya
  // permintaan ini yang perlu diulang saat MA atau RSI diganti, bukan seluruh
  // rangkaian di atas. Seri hariannya sudah ter-cache di backend, jadi
  // mengganti periode tidak menambah satu pun kredit Sectors.
  useEffect(() => {
    let batal = false;
    getIndicators(symbol, { maPeriods, rsiPeriod })
      .then((ind) => {
        if (!batal) setIndicators(ind);
      })
      .catch(() => {
        if (!batal) setIndicators(null);
      });
    return () => {
      batal = true;
    };
  }, [symbol, maPeriods, rsiPeriod]);

  // Pengukuran penggaris melekat pada emiten dan rentang yang sedang dilihat;
  // membiarkannya bertahan setelah keduanya berubah akan menampilkan angka
  // yang tidak lagi merujuk apa pun di layar.
  useEffect(() => {
    setMeasurement(null);
  }, [symbol, rangeDays]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-space-8 px-space-16 py-space-16" aria-busy="true">
        <div className="h-40 animate-pulse rounded border border-border-subtle bg-surface-card" />
        <div className="h-[420px] animate-pulse rounded border border-border-subtle bg-surface-card" />
        <div className="h-52 animate-pulse rounded border border-border-subtle bg-surface-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1440px] px-space-16 py-space-16">
        <div className="rounded border border-state-negative/40 bg-state-negative/10 px-space-16 py-space-12">
          <p className="font-body-md text-body-md text-state-negative">{error}</p>
          <Link to="/" className="mt-space-8 inline-block font-body-sm text-body-sm font-semibold text-primary hover:text-accent-hover">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!score) return null;

  const scoredComponents = score.components;
  const expanded = isFullscreen || expandedInPage;

  // Daftar isi hanya menyebut bagian yang benar-benar dirender untuk emiten
  // ini; menautkan judul ke panel yang tidak ada akan membuat jangkarnya mati.
  const sections: SectionLink[] = [
    { id: 'ringkasan-jawaban', label: 'Ringkasan' },
    { id: 'grafik-harga', label: 'Grafik & Teknikal' },
    { id: 'komponen-skor', label: 'Komponen Skor' },
    ...(peer ? [{ id: 'konteks-sektor', label: 'Posisi di Sektor' }] : []),
    ...(extras && extras.historicalValuation.length > 0 ? [{ id: 'historis-valuasi', label: 'Valuasi' }] : []),
    ...(extras && extras.historicalFinancials.length > 0 ? [{ id: 'laporan-keuangan', label: 'Laporan Keuangan' }] : []),
    ...(profile && extras ? [{ id: 'profil-dividen', label: 'Profil & Dividen' }] : []),
    { id: 'berita-emiten', label: 'Berita' },
  ];

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-space-8 px-space-16 py-space-16">
      <EmitenIdentityCard symbol={symbol} peer={peer} score={score} extras={extras} bars={bars} />

      <SectionNav sections={sections} />

      <div id="ringkasan-jawaban" className="scroll-mt-[104px]">
        <EmitenAnswerCard
          symbol={symbol}
          score={score}
          peer={peer}
          extras={extras}
          onAskAi={() => setAiOpenSignal((n) => n + 1)}
        />
      </div>

      {peer && <PeerDataWarning failures={peer.fetchFailures} groupSize={peer.groupSize} />}

      {score.status === 'inadequate' && (
        <p className="rounded border border-state-warning/40 bg-state-warning/10 px-space-12 py-space-8 font-body-sm text-body-sm text-state-warning">
          Emiten ini kehilangan lebih dari satu komponen data yang dibutuhkan untuk Skor Komposit, sehingga sengaja tidak diberi skor agar tidak
          menyesatkan.
        </p>
      )}

      {/* Chart (left) beside the analysis rail (right). The mockup's rail held a
          buy/sell consensus meter and an order book: the first is a
          recommendation the PRD forbids, the second needs an order-flow feed
          Sectors does not provide. The score breakdown and the pattern list
          take that space instead — same layout, real content. */}
      {/* `items-start` dipertahankan: tiap panel memakai tinggi alaminya.
          Sempat dicoba meregangkan panel terakhir tiap kolom agar dasarnya
          sejajar, dan hasilnya ditolak dengan alasan yang benar — tinggi kolom
          kiri berubah-ubah mengikuti panel lipat yang dibuka pembaca, sehingga
          Deteksi Anomali bisa terentang sampai ratusan piksel berisi udara.
          Celah di antara dua kolom yang isinya memang berbeda panjang lebih
          jujur daripada kartu yang digelembungkan untuk menutupinya. */}
      <div id="grafik-harga" className="grid scroll-mt-[104px] grid-cols-1 items-start gap-space-8 xl:grid-cols-12">
        <div className="flex flex-col gap-space-8 xl:col-span-8">
        <div
          ref={chartWrapperRef}
          className={
            expandedInPage
              ? 'fixed inset-0 z-50 flex flex-col overflow-hidden border border-border-subtle bg-surface-card'
              : 'flex flex-col overflow-hidden rounded border border-border-subtle bg-surface-card'
          }
        >
          <ChartToolbar
            rangeDays={rangeDays}
            onRangeChange={setRangeDays}
            chartType={chartType}
            onChartTypeChange={setChartType}
            showMA={showMA}
            showRsi={showRsi}
            showPatterns={showPatterns}
            onToggleMA={() => setShowMA((v) => !v)}
            onToggleRsi={() => setShowRsi((v) => !v)}
            onTogglePatterns={() => setShowPatterns((v) => !v)}
            onReset={() => setResetSignal((n) => n + 1)}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={expanded}
          />
          <ChartReadout symbol={symbol} bar={readout} />
          <div className={`flex bg-background-base ${expanded ? 'min-h-0 flex-1' : 'h-[480px]'}`}>
            <DrawingToolbar tool={drawingTool} onToolChange={setDrawingTool} onClearAll={() => setClearSignal((n) => n + 1)} />
            <div className="min-w-0 flex-1">
              <PriceChart
                bars={visibleBars}
                patterns={chartPatterns}
                movingAverages={visibleMovingAverages}
                rsi={visibleRsi}
                drawingTool={drawingTool}
                onDrawComplete={() => setDrawingTool('none')}
                clearSignal={clearSignal}
                chartType={chartType}
                resetSignal={resetSignal}
                onReadoutChange={setReadout}
                onMeasure={setMeasurement}
              />
            </div>
          </div>
          {/* Hasil penggaris. Angka murni pengukuran dua titik yang diklik
              pengguna — tidak ada proyeksi, target, maupun pernyataan arah. */}
          {measurement && (
            <div className="flex flex-wrap items-center gap-space-12 border-t border-border-subtle bg-surface-container-lowest px-space-12 py-space-8">
              <span className="flex items-center gap-space-4 font-table-header text-table-header uppercase text-text-muted">
                <span className="material-symbols-outlined text-[16px] text-primary">straighten</span>
                Hasil ukur
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-text-muted">
                {measurement.fromDate} &rarr; {measurement.toDate}
              </span>
              <span className="font-label-mono-md text-label-mono-md font-bold tabular-nums text-text-primary">
                {measurement.priceChange >= 0 ? '+' : ''}
                {measurement.priceChange.toFixed(0)}
              </span>
              <span className="font-label-mono-md text-label-mono-md font-bold tabular-nums text-text-primary">
                {measurement.percentChange >= 0 ? '+' : ''}
                {(measurement.percentChange * 100).toFixed(2)}%
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-text-secondary">
                {measurement.tradingDays} hari bursa
              </span>
              <button
                type="button"
                onClick={() => setMeasurement(null)}
                className="ml-auto font-label-mono-sm text-label-mono-sm text-text-muted transition-colors hover:text-state-negative"
              >
                Tutup
              </button>
            </div>
          )}
          <p className="border-t border-border-subtle p-space-12 font-label-mono-sm text-label-mono-sm text-text-muted">
            Rentang maksimal 3 bulan &mdash; Sectors API membatasi riwayat harga harian di sekitar 90 hari, sehingga 6 bulan ke atas tidak
            tersedia. Aktifkan &quot;Pola&quot; untuk menandai pola candlestick di grafik, lalu pilih pola mana yang ditandai di panel di
            bawahnya.
          </p>
        </div>

        {/* Kendali pembaca atas grafik di atasnya: pola mana yang ditandai,
            dan berapa hari yang dipakai tiap indikator. Sebelumnya keduanya
            terkunci — pembaca hanya bisa menerima apa pun yang muncul. */}
        {patterns && patterns.status === 'ok' && patterns.frequencies.length > 0 && (
          <PatternPicker
            frequencies={visibleFrequencies}
            barsScanned={visibleBars.length}
            selected={selectedPatterns ?? new Set(visibleFrequencies.filter((f) => f.count > 0).map((f) => f.key))}
            onToggle={(key) =>
              setSelectedPatterns((prev) => {
                // Dari keadaan "semua", melepas satu centang harus dimulai dari
                // daftar penuh — bukan dari daftar kosong, yang akan membuat
                // klik pertama justru mematikan semua pola selain yang ditekan.
                const dasar =
                  prev === null ? new Set(visibleFrequencies.filter((f) => f.count > 0).map((f) => f.key)) : new Set(prev);
                if (dasar.has(key)) dasar.delete(key);
                else dasar.add(key);
                return dasar;
              })
            }
            onSelectAll={() => setSelectedPatterns(null)}
            onClear={() => setSelectedPatterns(new Set())}
            onSelectRare={() =>
              setSelectedPatterns(new Set(visibleFrequencies.filter((f) => f.count > 0 && f.rate < 0.15).map((f) => f.key)))
            }
          />
        )}

{/* Daftar pola pindah ke kolom kiri, tepat di bawah pemilihnya.
            Keduanya membicarakan hal yang sama — pemilih menentukan pola mana
            yang ditandai di grafik, daftar ini menyebut kapan tiap pola muncul
            — sehingga memisahkannya ke rail seberang memaksa mata melompat
            bolak-balik. Perpindahan ini sekaligus menyeimbangkan tinggi kedua
            kolom, yang sebelumnya menyisakan ruang kosong panjang di bawah
            rail kanan. */}
        {visiblePatterns.length > 0 && (
          <DisclosurePanel
            title="Pola Candlestick"
            icon="candlestick_chart"
            summary={`Terakhir ${[...visiblePatterns].sort((a, b) => b.date.localeCompare(a.date))[0].label}`}
            badge={`${visiblePatterns.length} pola`}
          >
            <div className="flex flex-col gap-space-4">
              {[...visiblePatterns]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((m, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-space-8 font-label-mono-sm text-label-mono-sm">
                    <span className="text-text-muted">{m.date}</span>
                    <span className="font-semibold text-text-secondary">{m.label}</span>
                  </div>
                ))}
            </div>
          </DisclosurePanel>
        )}

        {indicators && indicators.status === 'ok' && (
          <IndicatorSettings
            indicators={indicators}
            maPeriods={maPeriods}
            rsiPeriod={rsiPeriod}
            onMaPeriodsChange={setMaPeriods}
            onRsiPeriodChange={setRsiPeriod}
            showMA={showMA}
            showRsi={showRsi}
          />
        )}

        {anomaly && anomaly.status === 'ok' && <AnomalyPanel anomaly={anomaly} />}
        </div>

        <div className="flex flex-col gap-space-8 xl:col-span-4">
          {/* Jangkarnya menempel di panel ini, bukan di pembungkus rail:
              pembungkusnya bermula sejajar dengan puncak grafik, sehingga
              melompat ke sana mendaratkan pembaca di depan grafik dan bukan
              di depan bagian yang dimaksud. */}
          <Panel
            id="komponen-skor"
            title="Komponen Skor"
            icon="analytics"
            action={
              <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{STATUS_LABEL[score.status]}</span>
            }
          >
            {scoredComponents.length > 0 ? (
              <>
                <div className="mb-space-12 rounded border border-border-subtle bg-surface-container-lowest p-space-8">
                  <p className="font-body-md text-body-md leading-relaxed text-text-muted">
                    Angka yang <strong className="text-text-primary">benar-benar dilaporkan</strong>{' '}
                    {symbol.toUpperCase().replace(/\.JK$/, '')}, di balik tiap peringkat yang dijumlahkan pada ringkasan di
                    atas. Batangnya menyatakan posisi terhadap{' '}
                    <strong className="text-text-primary">{scoredComponents[0].groupSize} emiten</strong> sub-sektor yang sama.
                  </p>
                  <p className="mt-space-6 flex flex-wrap items-center gap-x-space-8 gap-y-space-4 border-t border-border-subtle pt-space-6 font-label-mono-sm text-label-mono-sm">
                    <span className="text-state-negative">persentil 0 = terburuk</span>
                    <span className="text-text-muted">&middot;</span>
                    <span className="text-state-warning">50 = pertengahan</span>
                    <span className="text-text-muted">&middot;</span>
                    <span className="text-state-positive">100 = terbaik</span>
                  </p>
                </div>
                {!scoredComponents[0].groupSizeAdequate && (
                  <p className="mb-space-8 rounded border border-state-warning/40 bg-state-warning/10 px-space-8 py-space-6 font-body-sm text-body-sm text-state-warning">
                    Kelompok pembanding hanya {scoredComponents[0].groupSize} emiten &mdash; terlalu sedikit untuk persentil yang bermakna.
                  </p>
                )}
                <div className="flex flex-col gap-space-12">
                  {scoredComponents.map((c) => (
                    <BarisKomponen key={c.key} komponen={c} glossaryTerm={SCORE_GLOSSARY[c.key]} />
                  ))}
                </div>
              </>
            ) : (
              <p className="font-body-sm text-body-sm text-text-muted">Komponen skor tidak tersedia untuk emiten ini.</p>
            )}
          </Panel>

          {framework && <FScorePanel framework={framework} />}

          {/* Statistik harga dipindahkan dari kolom kiri ke rail ini. Kolom
              kiri memuat grafik setinggi 480 piksel beserta seluruh kendalinya
              sehingga jauh lebih jangkung daripada rail, dan sisa ruang di
              bawah daftar pola tertinggal kosong. Panel ini tetap berdampingan
              dengan grafik yang diringkasnya — rentangnya memang mengikuti
              rentang grafik — sekaligus mengisi ruang yang menganggur itu. */}
          <PriceStatsPanel bars={visibleBars} rangeLabel={RANGE_LABEL[rangeDays]} />

        </div>
      </div>

      {peer && (
        <div id="konteks-sektor" className="scroll-mt-[104px]">
          <SectorContextPanel symbol={symbol} peer={peer} score={score} extras={extras} />
        </div>
      )}

      {extras && extras.historicalValuation.length > 0 && (
        <div id="historis-valuasi" className="scroll-mt-[104px]">
          <ValuationHistoryTable symbol={symbol} rows={extras.historicalValuation} />
        </div>
      )}

      {extras && extras.historicalFinancials.length > 0 && (
        <div id="laporan-keuangan" className="scroll-mt-[104px]">
          <FinancialStatementsPanel symbol={symbol} rows={extras.historicalFinancials} />
        </div>
      )}

      {profile && extras && (
        <div id="profil-dividen" className="scroll-mt-[104px]">
        <CompanyProfilePanel
          profile={profile}
          dividendHistory={extras.dividendHistory}
          payoutRatio={extras.payoutRatio}
          dividendYieldAvg={extras.dividendYieldAvg}
          dividendYieldAvgPeriod={extras.dividendYieldAvgPeriod}
          lastExDividendDate={extras.lastExDividendDate}
        />
        </div>
      )}

      {(showMA || showRsi) && indicators?.status === 'ok' && (
        <Panel title="Penjelasan Indikator" icon="show_chart">
          <div className="flex flex-col gap-space-6 font-body-sm text-body-sm text-text-secondary">
            {showMA && <p>{indicators.explanation.movingAverage}</p>}
            {showRsi && <p>{indicators.explanation.rsi}</p>}
          </div>
        </Panel>
      )}

      <div id="berita-emiten" className="scroll-mt-[104px]">
        <EmitenNewsPanel key={symbol} symbol={symbol} />
      </div>

      <PatternSimilarityPanel symbol={symbol} variant="card" />

      <FloatingAIChat
        scopeLabel={symbol.toUpperCase()}
        scopeNote="Hanya menjelaskan data yang sudah dihitung di halaman ini — bukan rekomendasi investasi."
        ask={(q) => askAboutEmiten(symbol, q)}
        openSignal={aiOpenSignal}
        suggestions={[
          // Disusun ulang mengikuti pertanyaan yang benar-benar diucapkan
          // responden saat uji pengguna, bukan tebakan penulisnya.
          'Angka Skor Komposit itu dihitung dari apa saja?',
          'Apa bedanya perusahaan bagus dan saham yang harganya murah?',
          'Kenapa DER-nya segitu?',
          'Jelaskan hasil framework investasinya',
        ]}
      />
    </div>
  );
}
