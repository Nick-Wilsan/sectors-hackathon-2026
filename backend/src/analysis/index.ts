// Analysis layer: turns normalized Sectors data into scores, percentiles,
// anomaly flags, candlestick patterns, and technical indicators.
// This layer must never call the AI provider or the Sectors client directly —
// it only consumes data already fetched/normalized by src/data.
//
// Planned modules (filled in per feature, in roadmap priority order):
// - score.ts       (F-01 Skor Komposit Fundamental)
// - screener.ts     (F-02 Screener dengan Logika Kustom)
// - peer.ts         (F-03 Perbandingan Peer dan Sektor)
// - framework.ts    (F-04 Framework Investasi Preset)
// - anomaly.ts       (F-06 Deteksi Anomali)
// - pattern.ts       (F-07 Pengenalan Pola Candlestick)
// - indicators.ts    (F-08 Indikator Teknikal)

export {};
