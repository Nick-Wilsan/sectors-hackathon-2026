import { Router } from 'express';
import { getIndexDaily, getIdxTotal, getTopMoversToday } from '../data/market.js';
import { getNews } from '../data/news.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';

export const marketRouter = Router();

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
    const [ihsg, idxTotal, movers] = await Promise.all([
      getIndexDaily('ihsg', { start: daysAgoIso(90), end: todayIso() }),
      getIdxTotal({ start: daysAgoIso(30), end: todayIso() }),
      getTopMoversToday(5),
    ]);

    res.json({ ihsg, idxTotal, movers });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
