import { Router } from 'express';
import { getIndexDaily, getIdxTotal, getTopMoversToday, getMostTradedToday, getMultipleIndices } from '../data/market.js';
import { getNews } from '../data/news.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';
import { getSectorSpotlight } from '../analysis/sectorSpotlight.js';
import { getValuationSpotlight } from '../analysis/valuationSpotlight.js';
import { getTickerTape } from '../analysis/tickerTape.js';
import { getMarketAnomalyScan } from '../analysis/marketAnomalyScan.js';

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

marketRouter.get('/overview', async (_req, res) => {
  try {
    const [ihsg, idxTotal, movers, mostTraded, indexChips, tickerTape] = await Promise.all([
      getIndexDaily('ihsg', { start: daysAgoIso(90), end: todayIso() }),
      getIdxTotal({ start: daysAgoIso(30), end: todayIso() }),
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
