import { Router } from 'express';
import { getScoredCompaniesInSubSector, screenCompanies, DEFAULT_GROUP_LIMIT, type ComponentRange, type ScreenerParams } from '../analysis/screener.js';
import { SCORE_COMPONENTS, type ComponentKey } from '../analysis/score.js';

export const screenerRouter = Router();

const COMPONENT_KEYS = SCORE_COMPONENTS.map((c) => c.key);

function parseNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isSortKey(value: unknown): value is ScreenerParams['sortBy'] {
  return value === 'score' || COMPONENT_KEYS.includes(value as ComponentKey);
}

screenerRouter.get('/', async (req, res) => {
  const subSector = req.query.subSector;
  if (typeof subSector !== 'string' || !subSector) {
    res.status(400).json({ error: 'Query parameter "subSector" is required, e.g. ?subSector=banks' });
    return;
  }

  const componentFilters: Partial<Record<ComponentKey, ComponentRange>> = {};
  for (const key of COMPONENT_KEYS) {
    const min = parseNumber(req.query[`min${capitalize(key)}`]);
    const max = parseNumber(req.query[`max${capitalize(key)}`]);
    if (min !== undefined || max !== undefined) componentFilters[key] = { min, max };
  }

  const sortByRaw = req.query.sortBy;
  const sortBy = isSortKey(sortByRaw) ? sortByRaw : 'score';
  const sortDirection = req.query.sortDirection === 'asc' ? 'asc' : 'desc';

  try {
    const { companies, groupSize, fetchFailures } = await getScoredCompaniesInSubSector(subSector, {
      limit: parseNumber(req.query.limit) ?? DEFAULT_GROUP_LIMIT,
    });

    const result = screenCompanies(companies, {
      subSector,
      sortBy,
      sortDirection,
      minScore: parseNumber(req.query.minScore),
      maxScore: parseNumber(req.query.maxScore),
      componentFilters,
    }, fetchFailures);

    res.json({ ...result, groupSize });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
