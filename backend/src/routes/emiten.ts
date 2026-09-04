import { Router } from 'express';
import { getCompositeScoreForSymbol } from '../analysis/scoreService.js';
import { getPeerComparison } from '../analysis/peerComparison.js';
import { evaluatePiotroskiAdapted } from '../analysis/framework.js';
import { getCompanyReport } from '../data/companyReport.js';
import { askAboutEmiten } from '../ai/askService.js';
import { getAnomalyWithContext } from '../analysis/anomalyService.js';
import { getCandlestickPatterns } from '../analysis/candlestickService.js';
import { getIndicators } from '../analysis/indicatorsService.js';
import { getDailySeries } from '../data/transactions.js';
import { daysAgoIso, todayIso } from '../data/dateRange.js';

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
    const series = await getDailySeries(symbol, { start: daysAgoIso(90), end: todayIso() });
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

emitenRouter.get('/:symbol/indikator', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await getIndicators(symbol);
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
