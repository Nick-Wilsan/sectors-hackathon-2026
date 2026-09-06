import type { CompanyProfile, DividendYear } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';

// Profil perusahaan dan riwayat dividen.
//
// Keduanya berasal dari section yang sudah diambil untuk keperluan lain
// (`overview` untuk menentukan sub-sektor, `dividend` untuk yield TTM), jadi
// panel ini tidak menambah satu pun panggilan API.
//
// Sectors TIDAK menyediakan paragraf deskripsi bisnis seperti pada beberapa
// platform lain, jadi panel ini tidak berpura-pura punya: yang ditampilkan
// hanyalah fakta terstruktur yang benar-benar dikirim — papan pencatatan,
// klasifikasi industri, alamat, jumlah karyawan, tanggal pencatatan, dan kontak.

interface Props {
  profile: CompanyProfile;
  dividendHistory: DividendYear[];
  payoutRatio: number | null;
  dividendYieldAvg: number | null;
  dividendYieldAvgPeriod: number | null;
  lastExDividendDate: string | null;
}

function formatIdrCompact(value: number): string {
  const n = (x: number) => x.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  if (value >= 1e12) return `Rp ${n(value / 1e12)} T`;
  if (value >= 1e9) return `Rp ${n(value / 1e9)} M`;
  if (value >= 1e6) return `Rp ${n(value / 1e6)} jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Lama tercatat di bursa, dihitung dari tanggal pencatatan. */
function yearsListed(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} tahun di bursa` : null;
}

function Fact({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
      <span className="block font-body-sm text-body-sm text-text-muted">{label}</span>
      <span className="block font-body-md text-body-md font-semibold text-text-primary">{value}</span>
      {note && <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">{note}</span>}
    </div>
  );
}

export function CompanyProfilePanel({
  profile,
  dividendHistory,
  payoutRatio,
  dividendYieldAvg,
  dividendYieldAvgPeriod,
  lastExDividendDate,
}: Props) {
  const paidYears = dividendHistory.filter((d) => d.totalDividend !== null && d.totalDividend > 0);
  const maxDividend = Math.max(...paidYears.map((d) => d.totalDividend ?? 0), 1);

  return (
    <div className="grid grid-cols-1 items-start gap-gutter-terminal xl:grid-cols-2">
      {/* ---------- profil ---------- */}
      <section className="rounded border border-border-subtle bg-surface-card p-space-16">
        <div className="flex items-start gap-space-8 border-b border-border-subtle pb-space-12">
          <span className="material-symbols-outlined text-[18px] text-primary-container">apartment</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Profil Perusahaan</h2>
            <p className="font-body-sm text-body-sm text-text-muted">
              Data pencatatan dan identitas emiten sebagaimana terdaftar di bursa.
            </p>
          </div>
        </div>

        <div className="mt-space-12 grid grid-cols-2 gap-space-8 sm:grid-cols-3">
          {profile.listingBoard && <Fact label="Papan pencatatan" value={profile.listingBoard} />}
          {profile.listingDate && (
            <Fact label="Tanggal pencatatan" value={formatDate(profile.listingDate) ?? profile.listingDate} note={yearsListed(profile.listingDate)} />
          )}
          {profile.marketCap !== null && (
            <Fact
              label="Kapitalisasi pasar"
              value={formatIdrCompact(profile.marketCap)}
              note={profile.marketCapRank !== null ? `Peringkat ${profile.marketCapRank} di IDX` : null}
            />
          )}
          {profile.employeeNum !== null && (
            <Fact
              label="Jumlah karyawan"
              value={profile.employeeNum.toLocaleString('id-ID')}
              note={profile.employeeNumRank !== null ? `Peringkat ${profile.employeeNumRank} di IDX` : null}
            />
          )}
          {profile.sector && <Fact label="Sektor" value={profile.sector} note={profile.subSector} />}
          {profile.industry && <Fact label="Industri" value={profile.industry} note={profile.subIndustry !== profile.industry ? profile.subIndustry : null} />}
        </div>

        {profile.address && (
          <div className="mt-space-8 rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
            <span className="block font-body-sm text-body-sm text-text-muted">Alamat terdaftar</span>
            <span className="block whitespace-pre-line font-body-sm text-body-sm text-text-secondary">{profile.address}</span>
          </div>
        )}

        {(profile.website || profile.email || profile.phone) && (
          <div className="mt-space-8 flex flex-wrap items-center gap-space-8 font-label-mono-sm text-label-mono-sm">
            {profile.website && (
              <a
                href={`https://${profile.website.replace(/^https?:\/\//, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 text-primary transition-colors hover:border-primary-container hover:text-accent-hover"
              >
                <span className="material-symbols-outlined text-[14px]">language</span>
                {profile.website}
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 text-text-secondary transition-colors hover:border-surface-variant"
              >
                <span className="material-symbols-outlined text-[14px]">mail</span>
                {profile.email}
              </a>
            )}
            {profile.phone && (
              <span className="flex items-center gap-space-4 rounded border border-border-subtle px-space-8 py-space-4 text-text-secondary">
                <span className="material-symbols-outlined text-[14px]">call</span>
                {profile.phone}
              </span>
            )}
          </div>
        )}

        {profile.priceExtremes.length > 0 && (
          <div className="mt-space-12 border-t border-border-subtle pt-space-12">
            <span className="block font-table-header text-table-header uppercase text-text-muted">Titik harga ekstrem</span>
            <div className="mt-space-8 grid grid-cols-2 gap-space-6 sm:grid-cols-4">
              {profile.priceExtremes.map((e) => (
                <div key={e.label} className="rounded border border-border-subtle/60 bg-surface-container-lowest px-space-8 py-space-6">
                  <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">{e.label}</span>
                  <span
                    className={`block font-label-mono-md text-label-mono-md font-bold tabular-nums ${
                      e.label.includes('Tertinggi') ? 'text-state-positive' : 'text-state-negative'
                    }`}
                  >
                    {e.price.toLocaleString('id-ID')}
                  </span>
                  <span className="block font-label-mono-sm text-label-mono-sm text-text-muted">{e.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ---------- dividen ---------- */}
      <section className="rounded border border-border-subtle bg-surface-card p-space-16">
        <div className="flex items-start gap-space-8 border-b border-border-subtle pb-space-12">
          <span className="material-symbols-outlined text-[18px] text-state-positive">payments</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Riwayat Dividen</h2>
            <p className="font-body-sm text-body-sm text-text-muted">
              Dividen yang benar-benar dibayarkan per tahun buku, bukan perkiraan pembagian berikutnya.
            </p>
          </div>
        </div>

        {paidYears.length === 0 ? (
          <p className="mt-space-12 font-body-sm text-body-sm text-text-muted">
            Emiten ini tidak memiliki riwayat pembagian dividen pada data Sectors.
          </p>
        ) : (
          <>
            <div className="mt-space-12 grid grid-cols-2 gap-space-8 sm:grid-cols-3">
              {payoutRatio !== null && (
                <Fact label="Payout ratio" value={`${(payoutRatio * 100).toFixed(1)}%`} note="Bagian laba yang dibagikan" />
              )}
              {dividendYieldAvg !== null && (
                <Fact
                  label="Rata-rata yield"
                  value={`${(dividendYieldAvg * 100).toFixed(2)}%`}
                  note={dividendYieldAvgPeriod ? `Rata-rata ${dividendYieldAvgPeriod} tahun` : null}
                />
              )}
              {lastExDividendDate && <Fact label="Ex-date terakhir" value={formatDate(lastExDividendDate) ?? lastExDividendDate} />}
            </div>

            <ul className="mt-space-12 flex flex-col gap-space-8">
              {paidYears.map((d) => (
                <li key={d.year}>
                  <div className="flex items-baseline justify-between gap-space-8">
                    <span className="flex items-baseline gap-space-8">
                      <span className="font-label-mono-md text-label-mono-md font-bold text-text-primary">{d.year}</span>
                      <span className="font-body-sm text-body-sm text-text-muted">
                        {d.breakdown.length > 1 ? `${d.breakdown.length} kali bagi` : '1 kali bagi'}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-space-8">
                      <span className="font-label-mono-md text-label-mono-md tabular-nums text-text-primary">
                        Rp {(d.totalDividend ?? 0).toLocaleString('id-ID')}
                      </span>
                      {d.totalYield !== null && (
                        <span className="font-label-mono-sm text-label-mono-sm tabular-nums text-state-positive">
                          {(d.totalYield * 100).toFixed(2)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-space-4 h-1 w-full overflow-hidden rounded-full bg-background-base">
                    <div
                      className="h-full rounded-full bg-state-positive"
                      style={{ width: `${Math.round(((d.totalDividend ?? 0) / maxDividend) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-space-12 flex items-start gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          <span>
            Seluruh angka di atas adalah pembagian yang sudah terjadi.{' '}
            <GlossaryTerm term="Dividend Yield">Yield</GlossaryTerm> masa lalu tidak menjamin pembagian berikutnya.
          </span>
        </p>
      </section>
    </div>
  );
}
