import type { ValuationYear } from '../api/types';
import { GlossaryTerm } from './GlossaryTerm';

interface Props {
  symbol: string;
  rows: ValuationYear[];
}

type MetricKey = 'pe' | 'pb' | 'ps' | 'pcf' | 'peg';

// peerKey menunjuk medan rata-rata peer untuk tiap rasio. Sectors tidak
// menyediakannya untuk P/CF dan PEG — pada baris itu peerKey menunjuk balik ke
// dirinya sendiri, yang dipakai sebagai penanda "tidak ada pembanding".
const METRICS: { key: MetricKey; peerKey: keyof ValuationYear; label: string; hint: string; glossary: string }[] = [
  { key: 'pe', peerKey: 'pePeerAvg', label: 'P/E Ratio (PER)', hint: 'Harga saham dibanding laba bersih per saham', glossary: 'P/E Ratio' },
  { key: 'pb', peerKey: 'pbPeerAvg', label: 'Price / Book (PBV)', hint: 'Harga saham dibanding nilai buku ekuitas per saham', glossary: 'PBV' },
  { key: 'ps', peerKey: 'psPeerAvg', label: 'Price / Sales (P/S)', hint: 'Harga saham dibanding pendapatan per saham', glossary: 'Price to Sales' },
  { key: 'pcf', peerKey: 'pcf', label: 'Price / Cash Flow (P/CF)', hint: 'Harga saham dibanding arus kas per saham', glossary: 'Price to Sales' },
  { key: 'peg', peerKey: 'peg', label: 'PEG Ratio', hint: 'P/E dibagi laju pertumbuhan laba', glossary: 'PEG Ratio' },
];

function fmt(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}x`;
}

/**
 * The mockup's "Historis Valuasi & Multiples" table. Its right-hand column was
 * a fabricated sector rank ("#2 dari 48"); Sectors does not expose a ranking,
 * but it does return the peer-group average for the SAME year alongside each
 * multiple — so the comparison here is that, which is a real number.
 *
 * Deliberately no "murah/mahal" verdict: PRD B-04 forbids concluding whether a
 * price is cheap or expensive. The table states the gap and stops there.
 */
export function ValuationHistoryTable({ symbol, rows }: Props) {
  if (rows.length === 0) return null;

  const years = rows.map((r) => r.year);
  const latest = rows[rows.length - 1];

  // Hanya rasio yang benar-benar punya rata-rata peer yang ditampilkan. Baris
  // tanpa pembanding dulu mengisi kolom peer dan selisih dengan strip "—", yang
  // melanggar aturan desain sendiri: kolom tanpa sumber data dihapus, bukan
  // diisi strip. Penyaringnya dinamis, jadi begitu Sectors mulai mengisi
  // rata-rata peer untuk sebuah rasio, barisnya muncul sendiri.
  const comparable = METRICS.filter(
    (m) => m.key !== m.peerKey && rows.some((r) => r[m.peerKey] !== null && r[m.peerKey] !== undefined),
  );
  const omitted = METRICS.filter((m) => !comparable.includes(m));

  if (comparable.length === 0) return null;

  return (
    <div className="rounded border border-border-subtle bg-surface-card p-space-16">
      <div className="flex flex-col gap-space-8 border-b border-border-subtle pb-space-12 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">table_chart</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">
              Historis Valuasi &amp; Multiples {symbol.toUpperCase()}
            </h2>
            <p className="font-body-sm text-body-sm text-text-muted">
              Rasio harga per tahun buku, disandingkan dengan rata-rata emiten sejenis pada tahun yang sama.
            </p>
          </div>
        </div>
        <span className="shrink-0 font-label-mono-sm text-label-mono-sm text-text-muted">
          Tahun buku {years[0]}&ndash;{years[years.length - 1]}
        </span>
      </div>

      <div className="mt-space-12 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle font-table-header text-table-header uppercase text-text-muted">
              <th className="py-space-6 font-semibold whitespace-nowrap">Metrik</th>
              {years.map((y) => (
                <th key={y} className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">
                  {y}
                </th>
              ))}
              <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">
                Rata-rata peer {latest.year}
              </th>
              <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap">Selisih</th>
              <th className="py-space-6 pl-space-12 text-right font-semibold whitespace-nowrap" title="Arah rasio dari tahun buku pertama ke terakhir">
                Tren {years[0]}&ndash;{years[years.length - 1]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/40">
            {comparable.map((m) => {
              const own = latest[m.key];
              const peer = latest[m.peerKey] as number | null;
              const comparable = m.key !== m.peerKey && own !== null && peer !== null && peer !== 0;
              const gap = comparable ? (own! - peer!) / peer! : null;

              // Direction across the whole window: first reported year to the
              // latest. Purely descriptive of where the ratio has moved.
              const first = rows.find((r) => r[m.key] !== null)?.[m.key] as number | undefined;
              const trend = first !== undefined && first !== 0 && own !== null ? (own! - first) / Math.abs(first) : null;
              return (
                <tr key={m.key} className="transition-colors hover:bg-surface-container-low">
                  <td className="py-space-8">
                    <span className="font-body-sm text-body-sm font-semibold text-text-primary">
                      <GlossaryTerm term={m.glossary}>{m.label}</GlossaryTerm>
                    </span>
                  </td>
                  {rows.map((r) => (
                    <td
                      key={r.year}
                      className={`py-space-8 pl-space-12 text-right font-label-mono-md text-label-mono-md tabular-nums whitespace-nowrap ${
                        r.year === latest.year ? 'font-bold text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {fmt(r[m.key])}
                    </td>
                  ))}
                  <td className="py-space-8 pl-space-12 text-right font-label-mono-md text-label-mono-md tabular-nums whitespace-nowrap text-text-secondary">
                    {fmt(peer)}
                  </td>
                  <td className="py-space-8 pl-space-12 text-right font-label-mono-md text-label-mono-md font-semibold tabular-nums whitespace-nowrap">
                    {gap === null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className={gap >= 0 ? 'text-state-warning' : 'text-state-positive'}>
                        {gap >= 0 ? '+' : ''}
                        {(gap * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="py-space-8 pl-space-12 text-right whitespace-nowrap">
                    {trend === null ? (
                      <span className="font-label-mono-md text-label-mono-md text-text-muted">—</span>
                    ) : (
                      <span className="inline-flex items-center justify-end gap-space-4">
                        {/* Bar length encodes the size of the move; the arrow encodes its direction. */}
                        <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-surface-container lg:block">
                          <span
                            className={`block h-full rounded-full ${trend >= 0 ? 'bg-state-warning' : 'bg-primary-container'}`}
                            style={{ width: `${Math.max(6, Math.min(100, Math.abs(trend) * 100))}%` }}
                          />
                        </span>
                        <span
                          className={`inline-flex items-center font-label-mono-md text-label-mono-md font-semibold tabular-nums ${
                            trend >= 0 ? 'text-state-warning' : 'text-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{trend >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                          {trend >= 0 ? '+' : ''}
                          {(trend * 100).toFixed(1)}%
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-space-8 flex items-start gap-space-4 border-t border-border-subtle pt-space-8 font-body-sm text-body-sm text-text-muted">
        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
        <span>
          &quot;Selisih&quot; adalah jarak rasio emiten ini terhadap rata-rata peer pada tahun buku terakhir. Angka positif berarti lebih tinggi
          dari rata-rata peer, negatif berarti lebih rendah &mdash; bukan penilaian murah atau mahal.
          {omitted.length > 0 && (
            <>
              {' '}
              {omitted.map((m) => m.label.replace(/\s*\(.*\)/, '')).join(' dan ')} tidak ditampilkan di sini karena Sectors tidak
              menyediakan rata-rata peer untuk rasio tersebut, sehingga tidak ada yang bisa disandingkan.
            </>
          )}
        </span>
      </p>
    </div>
  );
}
