import { Router } from 'express';
import { getSubsectors } from '../data/helperLists.js';

export const subsectorsRouter = Router();

subsectorsRouter.get('/', async (_req, res) => {
  try {
    const subsectors = await getSubsectors();
    res.json(
      subsectors.map((s) => ({ sector: s.sector, subsector: s.subsector, label: toLabel(s.subsector) })),
    );
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

function toLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
