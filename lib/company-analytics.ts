import { companies, sources, snapshotMeta, getSignalsForCompany } from "@/lib/data";
import { computeSignalMomentum, type MomentumBreakdown } from "@/lib/analytics/signal-momentum";

export interface CompanyMomentum {
  companyId: string;
  breakdown: MomentumBreakdown;
}

let cached: CompanyMomentum[] | null = null;

/** Momentum for every company as of the snapshot date (today, in demo data). */
export function allCompanyMomentum(): CompanyMomentum[] {
  if (cached) return cached;
  cached = companies.map((c) => ({
    companyId: c.id,
    breakdown: computeSignalMomentum(getSignalsForCompany(c.id), sources, snapshotMeta.snapshotDate),
  }));
  return cached;
}

export function momentumFor(companyId: string, asOf: string = snapshotMeta.snapshotDate) {
  return computeSignalMomentum(getSignalsForCompany(companyId), sources, asOf);
}
