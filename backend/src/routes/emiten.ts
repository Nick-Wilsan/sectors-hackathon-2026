import { Router } from 'express';
import { getCompositeScoreForSymbol } from '../analysis/scoreService.js';
import { getPeerComparison } from '../analysis/peerComparison.js';
import { evaluatePiotroskiAdapted } from '../analysis/framework.js';
import { getCompanyReport } from '../data/companyReport.js';
import { askAboutEmiten } from '../ai/askService.js';
import { getNews } from '../data/news.js';
import { getAnomalyWithContext } from '../analysis/anomalyService.js';
import { getCandlestickPatterns } from '../analysis/candlestickService.js';
import { getIndicators } from '../analysis/indicatorsService.js';
import { parseIndicatorOptions } from '../analysis/indicators.js';
import { getPatternSimilarity } from '../analysis/patternSimilarityService.js';
import { getFundamentalExtras } from '../analysis/fundamentalExtras.js';
import { getDailySeries } from '../data/transactions.js';
import { recentRange } from '../data/dateRange.js';
import { getCompanyProfile } from '../analysis/companyProfile.js';
import { summarizeTopics } from '../analysis/newsIndex.js';

export const emitenRouter = Router();

// Profil perusahaan. Memakai section `overview` yang sudah diambil saat
// menghitung skor, sehingga mengenai cache yang sama — 0 kredit.
emitenRouter.get('/:symbol/profil', async (req, res) => {
  try {
    res.json(await getCompanyProfile(req.params.symbol));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/skor', async (req, res) => {
  const { symbol } = req.params;
  const peerLimit = req.query.peerLimit ? Number(req.query.peerLimit) : undefined;

  try {
    const result = await getCompositeScoreForSymbol(symbol, { peerLimit });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/framework', async (req, res) => {
  const { symbol } = req.params;

  try {
    const report = await getCompanyReport(symbol, ['financials']);
    const result = evaluatePiotroskiAdapted(report.symbol, report.financials);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/anomali', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await getAnomalyWithContext(symbol);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/harga', async (req, res) => {
  const { symbol } = req.params;

  try {
    // Same 90-day window used by F-06/F-07 so this call hits the same cache entry.
    const series = await getDailySeries(symbol, recentRange(90));
    res.json(series);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/pola', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await getCandlestickPatterns(symbol);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Periode MA dan RSI dapat dipilih pengguna lewat query string
// (?ma=20,50&rsi=14). Nilai yang tidak masuk akal dijatuhkan diam-diam ke
// bawaan oleh parseIndicatorOptions, bukan menggagalkan panel — parameter ini
// berasal dari kendali di antarmuka, jadi galat di sini tidak dapat ditindak
// pengguna. Tidak menambah kredit: seri harian yang dipakai sama persis.
emitenRouter.get('/:symbol/indikator', async (req, res) => {
  const { symbol } = req.params;
  const options = parseIndicatorOptions(
    typeof req.query.ma === 'string' ? req.query.ma : undefined,
    typeof req.query.rsi === 'string' ? req.query.rsi : undefined,
  );

  try {
    const result = await getIndicators(symbol, options);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/kemiripan', async (req, res) => {
  const { symbol } = req.params;
  const candidateLimit = req.query.candidateLimit ? Number(req.query.candidateLimit) : undefined;

  try {
    const result = await getPatternSimilarity(symbol, { candidateLimit });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.post('/:symbol/tanya', async (req, res) => {
  const { symbol } = req.params;
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

  if (!question) {
    res.status(400).json({ error: 'Body harus berisi "question" (string, tidak kosong).' });
    return;
  }

  try {
    const result = await askAboutEmiten(symbol, question);
    res.json({ answer: result.answer });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Berita yang menyebut emiten ini. Sectors memberi tags per artikel, jadi
// kategori di UI adalah label asli dari sumber data, bukan hasil tebakan.
emitenRouter.get('/:symbol/berita', async (req, res) => {
  const { symbol } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 6;

  try {
    const result = await getNews({ symbols: [symbol], limit });
    // Sebaran topik disertakan agar antarmuka dapat menjawab "sisi perusahaan
    // mana yang sedang banyak diberitakan" tanpa pengguna membaca semua artikel
    // satu per satu. Ini hitungan kemunculan, bukan penilaian atas isinya.
    res.json({ ...result, topics: summarizeTopics(result.articles) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/tambahan', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await getFundamentalExtras(symbol);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

emitenRouter.get('/:symbol/peer', async (req, res) => {
  const { symbol } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  try {
    const result = await getPeerComparison(symbol, { limit });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
