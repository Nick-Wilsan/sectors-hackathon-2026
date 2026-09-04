// Analysis layer: turns normalized Sectors data into scores, percentiles,
// anomaly flags, candlestick patterns, and technical indicators.
// This layer must never call the AI provider directly — it only produces the
// structured context that src/ai is allowed to explain.
//
// Built so far:
// - percentile.ts   shared percentile-rank helper (used by F-01, and F-03 later)
// - score.ts         F-01 Skor Komposit Fundamental (pure scoring function)
// - scoreService.ts  F-01 orchestration (fetches peer group via src/data, calls score.ts)
//
// Planned modules (filled in per feature, in roadmap priority order):
// - screener.ts     (F-02 Screener dengan Logika Kustom)
// - peer.ts         (F-03 Perbandingan Peer dan Sektor)
// - framework.ts    (F-04 Framework Investasi Preset)
// - anomaly.ts       (F-06 Deteksi Anomali)
// - pattern.ts       (F-07 Pengenalan Pola Candlestick)
// - indicators.ts    (F-08 Indikator Teknikal)

export {};
