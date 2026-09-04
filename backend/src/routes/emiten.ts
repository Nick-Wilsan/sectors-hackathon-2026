import { Router } from 'express';
import { getCompositeScoreForSymbol } from '../analysis/scoreService.js';
import { getPeerComparison } from '../analysis/peerComparison.js';

export const emitenRouter = Router();

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
