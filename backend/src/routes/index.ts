import { Router } from 'express';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Feature routes are added here as each is built, e.g.:
// router.use('/emiten', emitenRouter);
// router.use('/screener', screenerRouter);
