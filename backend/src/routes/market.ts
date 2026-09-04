import { Router } from 'express';
import { getIndexDaily, getIdxTotal, getTopMoversToday } from '../data/market.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';

export const marketRouter = Router();

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
