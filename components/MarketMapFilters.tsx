"use client";

import { useState } from "react";
import Link from "next/link";
import type { Company, EvidenceLevel, MarketTheme, SignalCategory } from "@/lib/schemas";
import { Card, Pill } from "@/components/ui";

export interface MarketMapRow {
  company: Company;
  momentum: number;
  categories: SignalCategory[];
  bestEvidenceLevel: EvidenceLevel | null;
  latestSignalDate: string | null;
}

const THEMES: { id: MarketTheme; label: string; description: string }[] = [
  { id: "ai_infrastructure", label: "AI Infrastructure", description: "Compute, sandboxing, serving, and orchestration layers that AI products run on." },
  { id: "developer_tools", label: "Developer Tools", description: "Tooling that developers adopt directly, including local-first AI tooling." },
  { id: "ai_applications", label: "AI Applications", description: "End-user or workflow-facing products built on top of foundation models." },
  { id: "vertical_ai", label: "Vertical AI", description: "Domain-specific frameworks and applications for a specific industry or workflow." },
  { id: "fintech_infrastructure", label: "Fintech Infrastructure", description: "Infrastructure for payments, banking, and financial-data workflows." },
];

const EVIDENCE_RANK: Record<EvidenceLevel, number> = { A: 4, B: 3, C: 2, D: 1 };
const CATEGORIES: SignalCategory[] = ["product", "technical", "commercial", "founder", "organization", "market"];

export function MarketMapFilters({ rows }: { rows: MarketMapRow[] }) {
  const [category, setCategory] = useState<SignalCategory | "all">("all");
  const [minEvidence, setMinEvidence] = useState<EvidenceLevel | "any">("any");
  const [minMomentum, setMinMomentum] = useState(0);
  const [since, setSince] = useState("");

  const maxMomentum = Math.max(1, ...rows.map((r) => r.momentum));

  const filtered = rows.filter((r) => {
    if (category !== "all" && !r.categories.includes(category)) return false;
    if (minEvidence !== "any" && (!r.bestEvidenceLevel || EVIDENCE_RANK[r.bestEvidenceLevel] < EVIDENCE_RANK[minEvidence])) return false;
    if (r.momentum < minMomentum) return false;
    if (since && (!r.latestSignalDate || r.latestSignalDate < since)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 text-sm items-center">
        <label className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1">
          <span className="text-xs text-slate-500">Signal type</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as SignalCategory | "all")} className="text-xs bg-transparent">
            <option value="all">all</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1">
          <span className="text-xs text-slate-500">Min evidence</span>
          <select value={minEvidence} onChange={(e) => setMinEvidence(e.target.value as EvidenceLevel | "any")} className="text-xs bg-transparent">
            <option value="any">any</option>
            <option value="A">Level A</option>
            <option value="B">Level B+</option>
            <option value="C">Level C+</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1">
          <span className="text-xs text-slate-500">Signals since</span>
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="text-xs font-mono" />
        </label>
        <label className="flex items-center gap-2 border border-slate-300 rounded-md px-2 py-1 flex-1 min-w-[200px] max-w-xs">
          <span className="text-xs text-slate-500 shrink-0">Min momentum</span>
          <input
            type="range"
            min={0}
            max={Math.ceil(maxMomentum)}
            step={0.5}
            value={minMomentum}
            onChange={(e) => setMinMomentum(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-xs font-mono w-8 text-right">{minMomentum}</span>
        </label>
        {(category !== "all" || minEvidence !== "any" || minMomentum > 0 || since) && (
          <button
            onClick={() => {
              setCategory("all");
              setMinEvidence("any");
              setMinMomentum(0);
              setSince("");
            }}
            className="text-slate-400 hover:text-slate-600 px-1"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {rows.length} companies</span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {THEMES.map((theme) => {
          const themeRows = filtered.filter((r) => r.company.theme === theme.id);
          return (
            <Card key={theme.id} className="p-5">
              <h2 className="font-semibold text-slate-900">{theme.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{theme.description}</p>
              {themeRows.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400 italic">No companies match these filters in this theme.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {themeRows.map((r) => (
                    <li key={r.company.id}>
                      <Link href={`/companies/${r.company.id}`} className="flex items-center justify-between text-sm hover:bg-slate-50 -mx-2 px-2 py-1 rounded">
                        <span className="text-slate-800 flex items-center gap-2">
                          {r.company.name}
                          {r.bestEvidenceLevel && <Pill>Lvl {r.bestEvidenceLevel}</Pill>}
                        </span>
                        <span className="font-mono text-slate-500">{r.momentum.toFixed(1)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
