import { Router } from 'express';
import { getIndexDaily, getIdxTotal, getTopMoversToday, getMostTradedToday, getMultipleIndices } from '../data/market.js';
import { getNews } from '../data/news.js';
import { recentRange } from '../data/dateRange.js';
import { getNewsIndex } from '../analysis/newsIndex.js';
import { GLOSSARY } from '../ai/glossary.js';
import { getSectorSpotlight } from '../analysis/sectorSpotlight.js';
import { getValuationSpotlight } from '../analysis/valuationSpotlight.js';
import { getTickerTape } from '../analysis/tickerTape.js';
import { getMarketAnomalyScan } from '../analysis/marketAnomalyScan.js';
import { askAboutMarket, askAboutArticle } from '../ai/askService.js';
import { ArticleNotFoundError } from '../ai/newsAiContext.js';

export const marketRouter = Router();

// Chip row shown alongside IHSG on the dashboard — the well-known IDX
// benchmark indices, matching Sectors.app's "Top Indices" module.
const INDEX_CHIP_CODES = ['lq45', 'idx30', 'kompas100', 'idxbumn20', 'srikehati'];

marketRouter.get('/news', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 15;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const subSector = typeof req.query.subSector === 'string' ? [req.query.subSector] : undefined;

  try {
    const result = await getNews({ limit, offset, subSector });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Full index for the /berita page: one fetched corpus plus every facet the
// page filters on, so the browser can filter, sort and page without spending
// another credit per interaction.
// Kamus istilah untuk tooltip di antarmuka. Sumbernya berkas yang sama dengan
// konteks lapisan AI, supaya penjelasan di tooltip dan jawaban asisten tidak
// pernah berbeda. Tidak memanggil Sectors — 0 kredit.
marketRouter.get('/glosarium', (_req, res) => {
  res.json({ terms: GLOSSARY });
});

marketRouter.get('/berita', async (_req, res) => {
  try {
    res.json(await getNewsIndex());
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

marketRouter.get('/overview', async (_req, res) => {
  try {
    const [ihsg, idxTotal, movers, mostTraded, indexChips, tickerTape] = await Promise.all([
      getIndexDaily('ihsg', recentRange(90)),
      getIdxTotal(recentRange(30)),
      getTopMoversToday(8),
      getMostTradedToday(8),
      getMultipleIndices(INDEX_CHIP_CODES),
      getTickerTape(),
    ]);

    res.json({ ihsg, idxTotal, movers, mostTraded, indexChips, tickerTape });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// F-06 run across the day's busiest names. Separate from /overview because it
// costs one daily-series credit per scanned symbol; keeping it its own request
// means the main dashboard still paints if this is slow or unavailable.
marketRouter.get('/anomali', async (_req, res) => {
  try {
    res.json(await getMarketAnomalyScan());
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Asisten AI bercakupan dasbor. Konteksnya dibangun dari payload yang sudah
// dipakai halaman ini, sehingga tidak menambah kredit dan tidak pernah
// menjawab tentang data yang tidak ditampilkan di layar.
marketRouter.post('/tanya', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) {
    res.status(400).json({ error: 'Body harus berisi "question" (string, tidak kosong).' });
    return;
  }

  try {
    res.json({ answer: await askAboutMarket(question) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Asisten AI bercakupan satu artikel berita.
marketRouter.post('/berita/:id/tanya', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) {
    res.status(400).json({ error: 'Body harus berisi "question" (string, tidak kosong).' });
    return;
  }

  try {
    res.json({ answer: await askAboutArticle(req.params.id, question) });
  } catch (err) {
    if (err instanceof ArticleNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Heavier, non-critical dashboard widgets — fetched separately from /overview
// so a slow sub-sector aggregation never blocks the fast, always-needed data.
marketRouter.get('/sorotan', async (_req, res) => {
  try {
    const [sektor, valuasi] = await Promise.all([getSectorSpotlight(), getValuationSpotlight(4)]);
    res.json({ sektor, valuasi });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
