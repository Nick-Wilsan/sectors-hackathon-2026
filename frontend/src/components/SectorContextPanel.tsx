import { Link } from 'react-router-dom';
import type { CompositeScoreResult, FundamentalExtras, PeerComparisonResult } from '../api/types';

interface Props {
  symbol: string;
  peer: PeerComparisonResult;
  score: CompositeScoreResult | null;
  extras: FundamentalExtras | null;
}

function idrCompact(value: number): string {
  const n = (x: number) => x.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  if (Math.abs(value) >= 1e12) return `Rp ${n(value / 1e12)} T`;
  if (Math.abs(value) >= 1e9) return `Rp ${n(value / 1e9)} M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function tierBar(score: number): string {
  if (score >= 67) return 'bg-state-positive';
  if (score >= 34) return 'bg-state-warning';
  return 'bg-state-negative';
}

/** Big figure + unit, the shared headline treatment across the three cards. */
function Figure({ value, unit, tone = 'text-text-primary' }: { value: string; unit?: string; tone?: string }) {
  return (
    <div className="mt-space-12 flex items-baseline gap-space-6">
      <span className={`font-display-lg text-display-lg tracking-tight tabular-nums ${tone}`}>{value}</span>
      {unit && <span className="font-body-sm text-body-sm text-text-muted">{unit}</span>}
    </div>
  );
}

function CardShell({ title, icon, iconTone, children }: { title: string; icon: string; iconTone: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex items-start justify-between gap-space-8">
        <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">{title}</h3>
        <span className={`material-symbols-outlined text-[18px] ${iconTone}`}>{icon}</span>
      </div>
      {children}
    </div>
  );
}

function Footnote({ icon, tone, children }: { icon: string; tone: string; children: React.ReactNode }) {
  return (
    <p className={`mt-space-8 flex items-center gap-space-4 font-body-sm text-body-sm ${tone}`}>
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {children}
    </p>
  );
}

export function SectorContextPanel({ symbol, peer, score, extras }: Props) {
  const ranked = peer.peers.filter((p) => p.score !== null).sort((a, b) => b.score! - a.score!);
  const rank = ranked.findIndex((p) => p.symbol === peer.symbol) + 1;
  const scored = ranked.length;
  const ticker = symbol.toUpperCase();

  const financials = extras?.historicalFinancials ?? [];
  const earningsSeries = financials.filter((f) => f.earnings !== null).slice(-6);
  const latestFin = earningsSeries[earningsSeries.length - 1];
  const priorFin = earningsSeries[earningsSeries.length - 2];
  const earningsGrowth =
    latestFin?.earnings != null && priorFin?.earnings != null && priorFin.earnings !== 0
      ? (latestFin.earnings - priorFin.earnings) / Math.abs(priorFin.earnings)
      : null;
  const maxEarnings = Math.max(...earningsSeries.map((f) => Math.abs(f.earnings!)), 1);

  const pe = extras?.pe ?? null;
  const peerPe = extras?.pePeerAvg ?? null;
  const peGap = pe !== null && peerPe !== null && peerPe !== 0 ? (pe - peerPe) / peerPe : null;
  // Peer average sits at the midpoint of the track; the marker slides either
  // side of it. Neutral colours on purpose: position is a fact, "cheap" or
  // "expensive" is a verdict this product does not make (PRD B-04).
  const peMarkerPct = pe !== null && peerPe ? Math.max(3, Math.min(97, (pe / (peerPe * 2)) * 100)) : null;

  const scoreValue = score?.score ?? null;
  const rankPct = rank > 0 && scored > 0 ? ((scored - rank + 1) / scored) * 100 : null;

  return (
    <div className="flex flex-col gap-space-8">
      <div className="rounded border border-border-subtle bg-surface-card p-space-16">
        <div className="grid grid-cols-1 gap-space-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-space-6 font-label-mono-sm text-label-mono-sm">
              <span className="font-bold uppercase tracking-wider text-primary">Konteks Industri &amp; Peer Group</span>
              <span className="text-text-muted">&middot; {peer.groupSize} emiten terdaftar di IDX</span>
            </div>
            <h2 className="mt-space-4 font-headline-lg text-headline-lg tracking-tight text-text-primary">
              Sorotan Sub-Sektor: {peer.subSector}
            </h2>
            <p className="mt-space-8 font-body-md text-body-md leading-relaxed text-text-secondary">
              <strong className="text-primary">{ticker}</strong> diukur terhadap{' '}
              <strong className="text-text-primary">{peer.groupSize} emiten</strong> di sub-sektor {peer.subSector}. Dari{' '}
              <strong className="text-text-primary">{scored} emiten</strong> yang datanya cukup untuk dinilai,{' '}
              {rank > 0 ? (
                <>
                  {ticker} menempati <strong className="text-state-positive">peringkat {rank}</strong> berdasarkan Skor Komposit Fundamental
                </>
              ) : (
                <>{ticker} belum memiliki skor sehingga tidak masuk peringkat</>
              )}
              . Seluruh persentil di halaman ini dihitung terhadap kelompok yang sama, bukan terhadap seluruh bursa.
            </p>
          </div>

          <div className="rounded border border-border-subtle bg-surface-container-lowest p-space-12 lg:col-span-5">
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Statistik Kunci Sub-Sektor vs {ticker}</h3>
            <div className="mt-space-12 grid grid-cols-2 gap-space-12">
              <div>
                <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">Total Emiten</span>
                <span className="font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-text-primary">{peer.groupSize}</span>
              </div>
              <div>
                <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">Peringkat {ticker}</span>
                <span className="font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-primary">
                  {rank > 0 ? `${rank} / ${scored}` : '—'}
                </span>
              </div>
              <div>
                <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">Rata-rata P/E Peer</span>
                <span className="font-label-mono-lg text-label-mono-lg font-bold tabular-nums text-text-primary">
                  {peerPe !== null ? `${peerPe.toFixed(2)}x` : '—'}
                </span>
              </div>
              <div>
                <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">Skor {ticker}</span>
                <span
                  className={`font-label-mono-lg text-label-mono-lg font-bold tabular-nums ${
                    scoreValue !== null ? (scoreValue >= 67 ? 'text-state-positive' : scoreValue >= 34 ? 'text-state-warning' : 'text-state-negative') : 'text-text-muted'
                  }`}
                >
                  {scoreValue !== null ? `${scoreValue.toFixed(1)} / 100` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-8 lg:grid-cols-3">
        {/* 1 — where this emiten's P/E sits against the peer average. */}
        <CardShell title="Valuasi vs Rata-rata Peer" icon="bar_chart" iconTone="text-primary-container">
          <p className="mt-space-6 font-body-sm text-body-sm text-text-muted">
            Posisi P/E {ticker} terhadap rata-rata emiten sejenis pada tahun buku yang sama.
          </p>
          <Figure value={pe !== null ? pe.toFixed(2) : '—'} unit="x P/E" />
          <div className="mt-space-12">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-container">
              {peMarkerPct !== null && <div className="h-full rounded-full bg-primary-container" style={{ width: `${peMarkerPct}%` }} />}
              {/* Peer average is fixed at the midpoint of the track. */}
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-text-secondary" aria-hidden />
            </div>
            <div className="mt-space-4 flex justify-between font-label-mono-sm text-label-mono-sm text-text-muted">
              <span>0x</span>
              <span className="text-text-secondary">rata-rata peer {peerPe !== null ? `${peerPe.toFixed(2)}x` : '—'}</span>
              <span>{peerPe !== null ? `${(peerPe * 2).toFixed(1)}x` : '—'}</span>
            </div>
          </div>
          {peGap !== null ? (
            <Footnote icon="straighten" tone={peGap >= 0 ? 'text-state-warning' : 'text-state-positive'}>
              {peGap >= 0 ? '+' : ''}
              {(peGap * 100).toFixed(1)}% terhadap rata-rata peer
            </Footnote>
          ) : (
            <Footnote icon="help" tone="text-text-muted">
              Perbandingan tidak tersedia
            </Footnote>
          )}
        </CardShell>

        {/* 2 — composite score as a filled gauge, the closest analogue to the mockup's health bar. */}
        <CardShell title="Kesehatan Fundamental" icon="health_and_safety" iconTone="text-state-positive">
          <p className="mt-space-6 font-body-sm text-body-sm text-text-muted">
            Gabungan {score?.components.length ?? 0} rasio berbobot, dinilai sebagai persentil terhadap peer.
          </p>
          <Figure
            value={scoreValue !== null ? scoreValue.toFixed(1) : '—'}
            unit="/ 100"
            tone={
              scoreValue !== null
                ? scoreValue >= 67
                  ? 'text-state-positive'
                  : scoreValue >= 34
                    ? 'text-state-warning'
                    : 'text-state-negative'
                : 'text-text-primary'
            }
          />
          <div className="mt-space-12">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
              {scoreValue !== null && (
                <div className={`h-full rounded-full ${tierBar(scoreValue)}`} style={{ width: `${Math.max(2, Math.min(100, scoreValue))}%` }} />
              )}
            </div>
            <div className="mt-space-4 flex justify-between font-label-mono-sm text-label-mono-sm text-text-muted">
              <span>0 (terendah)</span>
              <span>50</span>
              <span>100 (tertinggi)</span>
            </div>
          </div>
          {rankPct !== null ? (
            <Footnote icon="social_leaderboard" tone="text-state-positive">
              Melampaui {rankPct.toFixed(0)}% emiten sejenis yang dinilai
            </Footnote>
          ) : (
            <Footnote icon="help" tone="text-text-muted">
              Belum masuk peringkat
            </Footnote>
          )}
        </CardShell>

        {/* 3 — reported earnings, drawn as a real per-year bar chart. */}
        <CardShell title="Laba Bersih Tahunan" icon="trending_up" iconTone="text-primary-container">
          <p className="mt-space-6 font-body-sm text-body-sm text-text-muted">
            Laba bersih menurut laporan keuangan, {earningsSeries.length} tahun buku terakhir.
          </p>
          <Figure value={latestFin?.earnings != null ? idrCompact(latestFin.earnings) : '—'} />
          {earningsSeries.length > 1 && (
            <div className="mt-space-12">
              <div className="flex h-12 items-end gap-space-4">
                {earningsSeries.map((f) => {
                  const h = Math.max(6, (Math.abs(f.earnings!) / maxEarnings) * 100);
                  const isLatest = f.year === latestFin?.year;
                  return (
                    <div
                      key={f.year}
                      title={`${f.year}: ${idrCompact(f.earnings!)}`}
                      className={`flex-1 rounded-sm ${
                        f.earnings! < 0 ? 'bg-state-negative' : isLatest ? 'bg-primary-container' : 'bg-primary-container/35'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-space-4 flex justify-between font-label-mono-sm text-label-mono-sm text-text-muted">
                <span>{earningsSeries[0].year}</span>
                <span>{latestFin?.year}</span>
              </div>
            </div>
          )}
          {earningsGrowth !== null ? (
            <Footnote icon={earningsGrowth >= 0 ? 'arrow_upward' : 'arrow_downward'} tone={earningsGrowth >= 0 ? 'text-state-positive' : 'text-state-negative'}>
              {earningsGrowth >= 0 ? '+' : ''}
              {(earningsGrowth * 100).toFixed(1)}% dibanding {priorFin!.year}
            </Footnote>
          ) : (
            <Footnote icon="help" tone="text-text-muted">
              Riwayat laba tidak tersedia
            </Footnote>
          )}
        </CardShell>
      </div>

      {ranked.length > 0 && (
        <div className="rounded border border-border-subtle bg-surface-card p-space-16">
          <div className="flex items-center justify-between gap-space-8 border-b border-border-subtle pb-space-8">
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Peringkat Peer &mdash; {peer.subSector}</h3>
            <span className="font-label-mono-sm text-label-mono-sm text-text-muted">{scored} emiten berskor</span>
          </div>
          <div className="mt-space-8 flex flex-col gap-space-4">
            {ranked.slice(0, 10).map((p, i) => {
              const isSelf = p.symbol === peer.symbol;
              return (
                <Link
                  key={p.symbol}
                  to={`/emiten/${p.symbol.replace('.JK', '')}`}
                  className={`flex items-center gap-space-8 rounded px-space-6 py-space-4 transition-colors ${
                    isSelf ? 'bg-primary-container/10' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <span className="w-5 shrink-0 text-right font-label-mono-sm text-label-mono-sm tabular-nums text-text-muted">{i + 1}</span>
                  <span className={`w-14 shrink-0 font-headline-sm text-headline-sm font-bold ${isSelf ? 'text-primary' : 'text-text-primary'}`}>
                    {p.symbol.replace('.JK', '')}
                  </span>
                  <span className="hidden min-w-0 flex-1 truncate font-body-sm text-body-sm text-text-muted md:block">{p.companyName}</span>
                  {/* Inline bar makes the spread between peers readable at a glance. */}
                  <span className="h-1.5 w-full max-w-[220px] flex-1 overflow-hidden rounded-full bg-surface-container">
                    <span className={`block h-full rounded-full ${tierBar(p.score!)}`} style={{ width: `${Math.max(2, p.score!)}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right font-label-mono-md text-label-mono-md font-bold tabular-nums text-text-secondary">
                    {p.score!.toFixed(0)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
