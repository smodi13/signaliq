import { companies, getSignalsForCompany, getFoundersForCompany } from "@/lib/data";
import { researchGapsFor } from "@/lib/research-gaps";
import { ResearchQueue } from "@/components/ResearchQueue";

export default function ResearchPage() {
  const gapCounts = Object.fromEntries(
    companies.map((c) => [c.id, researchGapsFor(c, getSignalsForCompany(c.id), getFoundersForCompany(c.id)).length]),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Research Queue</h1>
      <p className="mt-1 text-sm text-slate-600">
        Analyst work queue. Status and notes are stored locally in this browser only — they are not shared, synced,
        or written back to the snapshot.
      </p>
      <div className="mt-6">
        <ResearchQueue companies={companies} gapCounts={gapCounts} />
      </div>
    </div>
  );
}
