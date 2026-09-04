// Shared percentile-rank logic, used by F-01 (Skor Komposit) and F-03 (Perbandingan Peer).
// Tech Spec 5.1/5.2: normalisasi dilakukan relatif terhadap sebaran nilai pada
// kelompok pembanding (sub-sektor), bukan skala absolut.

export interface PercentileResult {
  /** 0-100. Share of the comparison group at or below this value. */
  percentile: number;
  /** Size of the comparison group actually used (non-null values only). */
  groupSize: number;
}

/**
 * Rank `value` against `groupValues` (same metric, same comparison group) as a
 * percentile from 0 to 100. Null/undefined entries in `groupValues` are excluded
 * from the group before ranking — a metric a peer doesn't report isn't a peer
 * that scored zero.
 *
 * Ties are ranked at their average position, so identical values across
 * companies land on the same percentile
 */
export function percentileRank(value: number, groupValues: (number | null | undefined)[]): PercentileResult {
  const sorted = groupValues.filter((v): v is number => v !== null && v !== undefined).sort((a, b) => a - b);
  const groupSize = sorted.length;

  if (groupSize === 0) {
    return { percentile: 50, groupSize: 0 };
  }

  let countBelow = 0;
  let countEqual = 0;
  for (const v of sorted) {
    if (v < value) countBelow++;
    else if (v === value) countEqual++;
  }

  // Average-rank convention: ties split the difference instead of all
  // rounding up or down, so a four-way tie doesn't produce four different scores.
  const rank = countBelow + countEqual / 2;
  const percentile = (rank / groupSize) * 100;

  return { percentile, groupSize };
}

/** Invert a percentile for metrics where lower raw values are better (e.g. DER). */
export function invertPercentile(percentile: number): number {
  return 100 - percentile;
}

/**
 * Minimum comparison-group size below which a percentile is not considered
 * meaningful (Tech Spec 5.2: "persentil pada kelompok yang sangat kecil tidak
 * bermakna dan berpotensi menyesatkan pengguna"). Callers must surface
 * `groupSize` to the user regardless — this constant only flags the case.
 */
export const MIN_MEANINGFUL_GROUP_SIZE = 5;
