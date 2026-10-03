import type { ReactNode } from "react";
import type { EvidenceLevel, Provenance } from "@/lib/schemas";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>{children}</div>;
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

const EVIDENCE_COLORS: Record<EvidenceLevel, string> = {
  A: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B: "bg-sky-100 text-sky-800 border-sky-200",
  C: "bg-amber-100 text-amber-800 border-amber-200",
  D: "bg-slate-100 text-slate-600 border-slate-200",
};

export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${EVIDENCE_COLORS[level]}`}>
      Level {level}
    </span>
  );
}

const PROVENANCE_LABELS: Record<Provenance, string> = {
  verified_fact: "Verified",
  source_reported: "Source-reported",
  analyst_assessment: "Analyst assessment",
  computed: "Computed",
  model_generated: "Model-generated",
  unknown: "Unknown",
};

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  const isUnknown = provenance === "unknown";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${
        isUnknown ? "bg-slate-50 text-slate-400 border-slate-200 italic" : "bg-indigo-50 text-indigo-700 border-indigo-200"
      }`}
    >
      {PROVENANCE_LABELS[provenance]}
    </span>
  );
}

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "indigo" | "emerald" | "amber" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
