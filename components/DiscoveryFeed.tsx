"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Company, EvidenceLevel, Signal, SignalCategory, SourceRecord, SourceType } from "@/lib/schemas";
import { Card, EvidenceBadge, Pill } from "@/components/ui";
import { whySurfaced } from "@/lib/why-surfaced";

const CATEGORY_TONE: Record<string, "slate" | "indigo" | "emerald" | "amber"> = {
  product: "indigo",
  technical: "emerald",
  commercial: "amber",
  founder: "indigo",
  organization: "slate",
  market: "slate",
};

const CATEGORIES: SignalCategory[] = ["product", "technical", "commercial", "founder", "organization", "market"];
const EVIDENCE_LEVELS: EvidenceLevel[] = ["A", "B", "C", "D"];

export function DiscoveryFeed({
  signals,
  companies,
  sources,
  snapshotDate,
}: {
  signals: Signal[];
  companies: Company[];
  sources: SourceRecord[];
  snapshotDate: string;
}) {
  const [category, setCategory] = useState<SignalCategory | "all">("all");
  const [companyId, setCompanyId] = useState<string | "all">("all");
  const [sourceType, setSourceType] = useState<SourceType | "all">("all");
  const [evidenceLevel, setEvidenceLevel] = useState<EvidenceLevel | "all">("all");
  const [recency, setRecency] = useState<"all" | "new">("all");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");

  const companiesById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const sourcesById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const sourceTypes = useMemo(() => [...new Set(sources.map((s) => s.type))].sort(), [sources]);

  const newCutoff = useMemo(() => {
    const d = new Date(snapshotDate);
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  }, [snapshotDate]);

  const filtered = useMemo(() => {
    return signals
      .filter((s) => category === "all" || s.category === category)
      .filter((s) => companyId === "all" || s.companyId === companyId)
      .filter((s) => evidenceLevel === "all" || s.evidenceLevel === evidenceLevel)
      .filter((s) => sourceType === "all" || sourcesById.get(s.sourceId)?.type === sourceType)
      .filter((s) => recency === "all" || (s.availabilityDate && s.availabilityDate >= newCutoff))
      .filter((s) => !since || (s.availabilityDate && s.availabilityDate >= since))
      .filter((s) => !until || (s.availabilityDate && s.availabilityDate <= until))
      .sort((a, b) => (b.availabilityDate ?? "").localeCompare(a.availabilityDate ?? ""));
  }, [signals, category, companyId, evidenceLevel, sourceType, recency, since, until, newCutoff, sourcesById]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5 text-sm">
        <Select label="Category" value={category} onChange={setCategory} options={["all", ...CATEGORIES]} />
        <Select
          label="Company"
          value={companyId}
          onChange={setCompanyId}
          options={["all", ...companies.map((c) => c.id)]}
          renderOption={(v) => (v === "all" ? "All companies" : companiesById.get(v)?.name ?? v)}
        />
        <Select label="Source" value={sourceType} onChange={setSourceType} options={["all", ...sourceTypes]} />
        <Select label="Evidence" value={evidenceLevel} onChange={setEvidenceLevel} options={["all", ...EVIDENCE_LEVELS]} renderOption={(v) => (v === "all" ? "all" : `Level ${v}`)} />
        <div className="flex items-center gap-1 border border-slate-300 rounded-md px-2 py-1">
          <label className="text-xs text-slate-500">Since</label>
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="text-xs font-mono" />
        </div>
        <div className="flex items-center gap-1 border border-slate-300 rounded-md px-2 py-1">
          <label className="text-xs text-slate-500">Until</label>
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="text-xs font-mono" />
        </div>
        <button
          onClick={() => setRecency(recency === "new" ? "all" : "new")}
          className={`rounded-md px-3 py-1 border ${recency === "new" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
        >
          New (last 7 days)
        </button>
        {(category !== "all" || companyId !== "all" || sourceType !== "all" || evidenceLevel !== "all" || recency !== "all" || since || until) && (
          <button
            onClick={() => {
              setCategory("all");
              setCompanyId("all");
              setSourceType("all");
              setEvidenceLevel("all");
              setRecency("all");
              setSince("");
              setUntil("");
            }}
            className="text-slate-400 hover:text-slate-600 px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">{filtered.length} signal{filtered.length === 1 ? "" : "s"}</p>

      <Card className="divide-y divide-slate-100">
        {filtered.length === 0 && <p className="p-8 text-sm text-slate-400 text-center">No signals match these filters.</p>}
        {filtered.map((s) => {
          const company = companiesById.get(s.companyId);
          const source = sourcesById.get(s.sourceId);
          return (
            <div key={s.id} className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="w-24 shrink-0 text-xs text-slate-500 font-mono pt-0.5">{s.availabilityDate ?? "undated"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {company && (
                      <Link href={`/companies/${company.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {company.name}
                      </Link>
                    )}
                    <Pill tone={CATEGORY_TONE[s.category]}>{s.category}</Pill>
                    <EvidenceBadge level={s.evidenceLevel} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{s.headline}</p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wide text-slate-400 mr-1.5">Why this surfaced</span>
                    {whySurfaced(s, source)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    {source && (
                      <a href={source.url} target="_blank" rel="noreferrer" title={source.title} className="text-indigo-600 hover:underline">
                        View evidence ↗
                      </a>
                    )}
                    {company && (
                      <Link href={`/companies/${company.id}`} className="text-slate-500 hover:text-slate-700">
                        View company →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  renderOption,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: T[];
  renderOption?: (v: T) => string;
}) {
  return (
    <label className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="text-xs bg-transparent">
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption ? renderOption(o) : o === "all" ? "all" : o}
          </option>
        ))}
      </select>
    </label>
  );
}
