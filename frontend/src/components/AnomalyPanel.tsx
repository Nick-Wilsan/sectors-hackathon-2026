import type { AnomalyResult } from '../api/types';
import { MarketContextBlock } from './MarketContextBlock';

function Panel({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded border border-border-subtle bg-surface-card px-space-16 py-space-24">
      <div className="flex items-center justify-between gap-space-8 border-b border-border-subtle pb-space-16">
        <div className="flex items-center gap-space-8">
          <span className="material-symbols-outlined text-[18px] text-primary-container">{icon}</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">{title}</h2>
        </div>
        {action}
      </div>
      {/* Jarak ke garis pemisah di atas dibuat sama dengan jarak ke garis di
          bawahnya (lihat `gap-space-16` pada isi panel), supaya kalimat
          keadaan duduk tepat di tengah dua garis, bukan menempel ke salah
          satunya. */}
      <div className="mt-space-16">{children}</div>
    </div>
  );
}

/** F-06 for a single emiten, shown directly under the chart it describes. */
export function AnomalyPanel({ anomaly }: { anomaly: AnomalyResult }) {
  return (
    <Panel
      title="Deteksi Anomali"
      icon="radar"
      action={
        <span
          className={`rounded px-space-6 py-space-2 font-label-mono-sm text-label-mono-sm font-bold ${
            anomaly.hasAnomaly ? 'bg-state-warning/10 text-state-warning' : 'bg-surface-container text-text-muted'
          }`}
        >
          {anomaly.hasAnomaly ? 'Tidak biasa' : 'Normal'}
        </span>
      }
    >
      <div className="flex flex-col gap-space-16">
        {!anomaly.hasAnomaly ? (
          <p className="font-body-sm text-body-sm text-text-muted">
            Volume dan pergerakan harga terakhir masih dalam kebiasaan emiten ini selama 90 hari terakhir.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-space-8 sm:grid-cols-2">
            {anomaly.metrics.map((m) => (
              <div
                key={m.key}
                className={`rounded border p-space-8 ${
                  m.isAnomaly ? 'border-state-warning/40 bg-state-warning/5' : 'border-border-subtle/60 bg-surface-container-lowest'
                }`}
              >
                <span className="block font-body-sm text-body-sm text-text-muted">{m.label}</span>
                <span
                  className={`font-label-mono-md text-label-mono-md font-bold tabular-nums ${
                    m.isAnomaly ? 'text-state-warning' : 'text-text-secondary'
                  }`}
                >
                  {m.zScore.toFixed(2)}σ {m.isAnomaly ? '— di luar kebiasaan' : '— normal'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Shown on quiet days too: "the whole bourse moved today" is context a
            reader needs before the number above means anything. */}
        {anomaly.marketContext ? (
          <MarketContextBlock context={anomaly.marketContext} disclaimer={anomaly.marketContextDisclaimer} />
        ) : (
          anomaly.status === 'ok' &&
          anomaly.date && (
            <p className="font-body-sm text-body-sm text-text-muted">
              Data IHSG untuk sesi {anomaly.date} belum tersedia dari sumber data, sehingga perbandingan dengan pasar belum
              dapat ditampilkan.
            </p>
          )
        )}

        {anomaly.relatedNews.length > 0 && (
          <div className="border-t border-border-subtle pt-space-8">
            <p className="font-body-sm text-body-sm text-text-muted">{anomaly.newsDisclaimer}</p>
            <div className="mt-space-6 flex flex-col gap-space-4">
              {anomaly.relatedNews.map((n, i) => (
                <a
                  key={i}
                  href={n.source}
                  target="_blank"
                  rel="noreferrer"
                  className="font-body-sm text-body-sm text-text-secondary transition-colors hover:text-primary"
                >
                  {n.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
