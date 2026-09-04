import { Router } from 'express';
import { getAllCompanies } from '../data/companies.js';

export const companiesRouter = Router();

companiesRouter.get('/', async (_req, res) => {
  try {
    const companies = await getAllCompanies();
    res.json(companies.map((c) => ({ symbol: c.symbol, companyName: c.companyName })));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
