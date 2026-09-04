import type { CompanyReportFinancials, FinancialRatioYear } from '../data/types.js';

// F-04 Framework Investasi Preset.
//
// Adapted from Joseph Piotroski's F-Score (2000) — a well-published, purely
// year-over-year classification checklist. We use 6 of the original 9
// criteria: the 3 dropped (change in shares outstanding, change in current
// ratio, change in gross margin) rely on fields that are inconsistently
// populated across sectors in Sectors' data (e.g. banks report no
// "current_liabilities"/"gross_profit"), so including them would silently
// degrade to "data tidak memadai" for a large share of emiten.
//
// Year-over-year comparison (rather than Graham-style absolute thresholds)
// was chosen deliberately: absolute thresholds like DER < 1 are calibrated
// for industrials and misclassify banks, which are structurally leveraged.
// "Improving vs last year" generalizes across business models.

export interface FrameworkCriterion {
  key: string;
  label: string;
  /** null = tidak dapat dievaluasi (data hilang), bukan gagal memenuhi kriteria. */
  met: boolean | null;
  detail: string;
}

export interface FrameworkResult {
  symbol: string;
  frameworkName: string;
  frameworkDescription: string;
  year: string | null;
  priorYear: string | null;
  criteria: FrameworkCriterion[];
  pointsMet: number;
  pointsApplicable: number;
  /** Descriptive classification only — never an action recommendation (PRD B-02). */
  classification: string;
  status: 'ok' | 'inadequate';
}

export const FRAMEWORK_NAME = 'F-Score Adaptasi Piotroski';
export const FRAMEWORK_DESCRIPTION =
  'Adaptasi dari Piotroski F-Score (Joseph Piotroski, 2000), memakai 6 dari 9 kriteria asli yang tersedia konsisten pada data Sectors lintas sektor. Setiap kriteria bernilai 1 jika kondisi terpenuhi, membandingkan tahun fiskal terbaru terhadap tahun sebelumnya. Ini adalah klasifikasi terhadap kriteria yang telah dipublikasikan, bukan anjuran investasi.';

// Below this many applicable criteria, a classification would be built on too
// thin a sample to be meaningful — same philosophy as F-01's >1-missing rule.
const MIN_APPLICABLE_CRITERIA = 4;

function latestTwoRatioYears(
  financials?: CompanyReportFinancials,
): [FinancialRatioYear | undefined, FinancialRatioYear | undefined] {
  const arr = financials?.historical_financial_ratio;
  if (!arr || arr.length === 0) return [undefined, undefined];
  const sorted = [...arr].sort((a, b) => Number(b.year) - Number(a.year));
  return [sorted[0], sorted[1]];
}

function financialsForYear(
  financials: CompanyReportFinancials | undefined,
  year: string | undefined,
): Record<string, unknown> | undefined {
  if (!year) return undefined;
  return financials?.historical_financials?.find((r) => String(r.year) === year);
}

function formatPercent(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function formatIdr(v: number): string {
  return v.toLocaleString('id-ID');
}

export function evaluatePiotroskiAdapted(symbol: string, financials?: CompanyReportFinancials): FrameworkResult {
  const [latest, prior] = latestTwoRatioYears(financials);
  const latestFin = financialsForYear(financials, latest?.year);
  const priorFin = financialsForYear(financials, prior?.year);

  const roa = latest?.profitability?.roa ?? null;
  const priorRoa = prior?.profitability?.roa ?? null;
  const der = latest?.leverage?.debt_to_equity_ratio ?? null;
  const priorDer = prior?.leverage?.debt_to_equity_ratio ?? null;
  const assetTurnover = latest?.efficiency?.total_asset_turnover ?? null;
  const priorAssetTurnover = prior?.efficiency?.total_asset_turnover ?? null;
  const ocf = (latestFin?.operating_cash_flow as number | null | undefined) ?? null;
  const earnings = (latestFin?.earnings as number | null | undefined) ?? null;

  const criteria: FrameworkCriterion[] = [
    {
      key: 'positiveRoa',
      label: 'Profitabilitas Aset Positif',
      met: roa === null ? null : roa > 0,
      detail: roa === null ? 'Data ROA tahun berjalan tidak tersedia.' : `ROA ${latest?.year}: ${formatPercent(roa)}`,
    },
    {
      key: 'positiveOcf',
      label: 'Arus Kas Operasional Positif',
      met: ocf === null ? null : ocf > 0,
      detail: ocf === null ? 'Data arus kas operasional tidak tersedia.' : `Arus kas operasional ${latest?.year}: ${formatIdr(ocf)}`,
    },
    {
      key: 'roaImproved',
      label: 'ROA Meningkat dari Tahun Sebelumnya',
      met: roa === null || priorRoa === null ? null : roa > priorRoa,
      detail:
        roa === null || priorRoa === null
          ? 'Data ROA dua tahun berurutan tidak lengkap.'
          : `ROA ${prior?.year}: ${formatPercent(priorRoa)} -> ${latest?.year}: ${formatPercent(roa)}`,
    },
    {
      key: 'ocfExceedsEarnings',
      label: 'Arus Kas Operasional Melebihi Laba Bersih',
      met: ocf === null || earnings === null ? null : ocf > earnings,
      detail:
        ocf === null || earnings === null
          ? 'Data arus kas operasional atau laba bersih tidak tersedia.'
          : `Arus kas operasional ${formatIdr(ocf)} vs laba bersih ${formatIdr(earnings)}`,
    },
    {
      key: 'derImproved',
      label: 'Rasio Utang terhadap Ekuitas Menurun',
      met: der === null || priorDer === null ? null : der < priorDer,
      detail:
        der === null || priorDer === null
          ? 'Data DER dua tahun berurutan tidak lengkap.'
          : `DER ${prior?.year}: ${priorDer.toFixed(2)} -> ${latest?.year}: ${der.toFixed(2)}`,
    },
    {
      key: 'assetTurnoverImproved',
      label: 'Perputaran Aset Meningkat',
      met: assetTurnover === null || priorAssetTurnover === null ? null : assetTurnover > priorAssetTurnover,
      detail:
        assetTurnover === null || priorAssetTurnover === null
          ? 'Data perputaran aset dua tahun berurutan tidak lengkap.'
          : `Perputaran aset ${prior?.year}: ${priorAssetTurnover.toFixed(2)} -> ${latest?.year}: ${assetTurnover.toFixed(2)}`,
    },
  ];

  const applicable = criteria.filter((c) => c.met !== null);
  const pointsMet = applicable.filter((c) => c.met === true).length;
  const pointsApplicable = applicable.length;
  const status: FrameworkResult['status'] = pointsApplicable >= MIN_APPLICABLE_CRITERIA ? 'ok' : 'inadequate';

  let classification = 'Data tidak memadai untuk klasifikasi';
  if (status === 'ok') {
    const ratio = pointsMet / pointsApplicable;
    const band = ratio >= 0.75 ? 'tinggi' : ratio >= 0.4 ? 'sedang' : 'rendah';
    classification = `Memenuhi ${pointsMet} dari ${pointsApplicable} kriteria yang dapat dievaluasi (${band})`;
  }

  return {
    symbol,
    frameworkName: FRAMEWORK_NAME,
    frameworkDescription: FRAMEWORK_DESCRIPTION,
    year: latest?.year ?? null,
    priorYear: prior?.year ?? null,
    criteria,
    pointsMet,
    pointsApplicable,
    classification,
    status,
  };
}
