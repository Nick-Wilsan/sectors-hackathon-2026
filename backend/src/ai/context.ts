import { getCompanyReport } from '../data/companyReport.js';
import { getCompositeScoreForSymbol } from '../analysis/scoreService.js';
import { getPeerComparison } from '../analysis/peerComparison.js';
import { evaluatePiotroskiAdapted } from '../analysis/framework.js';
import { getAnomalyWithContext } from '../analysis/anomalyService.js';
import { glossaryAsContext } from './glossary.js';

// Assembles the ONLY thing the AI layer is allowed to see: structured output
// already produced by the analysis layer (Technical Spec bagian 2 — "Lapisan
// AI tidak boleh mengambil data langsung dari sumber data"). No raw Sectors
// fields are included here beyond what F-01/F-03/F-04 already computed.

export interface EmitenAiContext {
  symbol: string;
  companyName: string;
  subSector: string;
  skorKomposit: {
    nilai: number | null;
    status: string;
    tahun: string | null;
    komponen: { label: string; nilaiMentah: number; persentil: number }[];
  };
  frameworkInvestasi: {
    nama: string;
    klasifikasi: string;
    kriteria: { label: string; terpenuhi: boolean | null; detail: string }[];
  };
  perbandinganPeer: {
    jumlahAnggotaKelompok: number;
    posisiSkorTerhadapPeer: { symbol: string; companyName: string; score: number | null }[];
  };
  deteksiAnomali: {
    status: string;
    tanggal: string | null;
    ambangBatas: string;
    metrik: { label: string; nilaiTerkini: number; rataRataBaseline: number; zScore: number; anomali: boolean }[];
    catatan: string;
  };
  kamusIstilah: Record<string, string>;
}

export async function buildEmitenAiContext(symbol: string): Promise<EmitenAiContext> {
  const [score, peer, report, anomaly] = await Promise.all([
    getCompositeScoreForSymbol(symbol),
    getPeerComparison(symbol),
    getCompanyReport(symbol, ['financials']),
    getAnomalyWithContext(symbol),
  ]);
  const framework = evaluatePiotroskiAdapted(symbol, report.financials);

  return {
    symbol: peer.symbol || score.symbol,
    companyName: peer.companyName,
    subSector: peer.subSector,
    skorKomposit: {
      nilai: score.score,
      status: score.status,
      tahun: score.year,
      komponen: score.components.map((c) => ({ label: c.label, nilaiMentah: c.rawValue, persentil: c.percentile })),
    },
    frameworkInvestasi: {
      nama: framework.frameworkName,
      klasifikasi: framework.classification,
      kriteria: framework.criteria.map((c) => ({ label: c.label, terpenuhi: c.met, detail: c.detail })),
    },
    perbandinganPeer: {
      jumlahAnggotaKelompok: peer.groupSize,
      // Cap the list sent to the model — it only needs enough peers to answer
      // "where does this rank," not every row (keeps prompts small and cheap).
      posisiSkorTerhadapPeer: [...peer.peers]
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        .slice(0, 15)
        .map((p) => ({ symbol: p.symbol, companyName: p.companyName, score: p.score })),
    },
    deteksiAnomali: {
      status: anomaly.status,
      tanggal: anomaly.date,
      ambangBatas: `${anomaly.threshold} standar deviasi dari rata-rata baseline`,
      metrik: anomaly.metrics.map((m) => ({
        label: m.label,
        nilaiTerkini: m.latestValue,
        rataRataBaseline: m.baselineMean,
        zScore: m.zScore,
        anomali: m.isAnomaly,
      })),
      catatan:
        'Anomali adalah pernyataan statistik semata (penyimpangan terhadap sebaran historis), bukan penyebab maupun perkiraan kelanjutan pergerakan harga.',
    },
    kamusIstilah: glossaryAsContext(),
  };
}
