import { Router } from 'express';
import { emitenRouter } from './emiten.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/emiten', emitenRouter);
// router.use('/screener', screenerRouter);
