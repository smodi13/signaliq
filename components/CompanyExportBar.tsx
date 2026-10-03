"use client";

import type { Company, Signal, SourceRecord } from "@/lib/schemas";
import { downloadCsv } from "@/lib/csv";

export function CompanyExportBar({
  company,
  signals,
  sources,
}: {
  company: Company;
  signals: Signal[];
  sources: SourceRecord[];
}) {
  const sourcesById = new Map(sources.map((s) => [s.id, s]));

  function exportSignals() {
    downloadCsv(
      `${company.name.toLowerCase()}-signals.csv`,
      signals.map((s) => ({
        date: s.availabilityDate ?? "",
        category: s.category,
        evidenceLevel: s.evidenceLevel,
        headline: s.headline,
        sourceUrl: sourcesById.get(s.sourceId)?.url ?? "",
        sourceType: sourcesById.get(s.sourceId)?.type ?? "",
      })),
    );
  }

  function exportEvidence() {
    downloadCsv(
      `${company.name.toLowerCase()}-sources.csv`,
      sources.map((s) => ({
        title: s.title,
        type: s.type,
        url: s.url,
        publicationDate: s.publicationDate ?? "",
        availabilityMethod: s.availabilityMethod,
      })),
    );
  }

  return (
    <div className="flex gap-2 print:hidden">
      <button onClick={exportSignals} className="text-xs rounded border border-slate-300 px-2.5 py-1 hover:bg-slate-50">
        Export signal timeline (CSV)
      </button>
      <button onClick={exportEvidence} className="text-xs rounded border border-slate-300 px-2.5 py-1 hover:bg-slate-50">
        Export source trail (CSV)
      </button>
      <button onClick={() => window.print()} className="text-xs rounded border border-slate-300 px-2.5 py-1 hover:bg-slate-50">
        Print research brief
      </button>
    </div>
  );
}
