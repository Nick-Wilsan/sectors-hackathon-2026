import { sectorsGet } from './sectorsClient.js';
import type { SubsectorEntry, IndustryEntry } from './types.js';

// Rarely changes — cache long (7 days) to avoid re-spending credits on every dev run.
const HELPER_LIST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** E-06: all sector/sub-sector pairs (kebab-case slugs). */
export async function getSubsectors(): Promise<SubsectorEntry[]> {
  return sectorsGet<SubsectorEntry[]>('/v2/subsectors/', { cacheTtlMs: HELPER_LIST_TTL_MS });
}

/** E-07: all sub-sector/industry pairs (kebab-case slugs). */
export async function getIndustries(): Promise<IndustryEntry[]> {
  return sectorsGet<IndustryEntry[]>('/v2/industries/', { cacheTtlMs: HELPER_LIST_TTL_MS });
}
