import { companies, getSignalsForCompany, snapshotMeta } from "@/lib/data";
import { momentumFor } from "@/lib/company-analytics";
import { isEligibleAsOf } from "@/lib/analytics/availability";
import { MarketMapFilters, type MarketMapRow } from "@/components/MarketMapFilters";
import type { EvidenceLevel } from "@/lib/schemas";

const EVIDENCE_RANK: Record<EvidenceLevel, number> = { A: 4, B: 3, C: 2, D: 1 };

export default function MarketMapPage() {
  const asOf = snapshotMeta.snapshotDate;
  const rows: MarketMapRow[] = companies.map((company) => {
    const signals = getSignalsForCompany(company.id).filter((s) => isEligibleAsOf(s, asOf));
    const bestEvidenceLevel = signals.reduce<EvidenceLevel | null>(
      (best, s) => (best === null || EVIDENCE_RANK[s.evidenceLevel] > EVIDENCE_RANK[best] ? s.evidenceLevel : best),
      null,
    );
    const latestSignalDate = signals.reduce<string | null>(
      (max, s) => (s.availabilityDate && (max === null || s.availabilityDate > max) ? s.availabilityDate : max),
      null,
    );
    return {
      company,
      momentum: momentumFor(company.id).momentum,
      categories: [...new Set(signals.map((s) => s.category))],
      bestEvidenceLevel,
      latestSignalDate,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Market Map</h1>
      <p className="mt-1 text-sm text-slate-600">
        Companies grouped by technology theme — a landscape view, not a ranking. Theme assignment is an analyst
        judgment call, not a verified fact. Click a company to open its research page.
      </p>

      <div className="mt-6">
        <MarketMapFilters rows={rows} />
      </div>
    </div>
  );
}
