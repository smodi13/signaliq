import { notFound } from "next/navigation";
import {
  companies,
  getCompany,
  getSignalsForCompany,
  getMilestonesForCompany,
  getFoundersForCompany,
  sources,
  getSourceRecord,
  snapshotMeta,
} from "@/lib/data";
import { momentumFor } from "@/lib/company-analytics";
import { computeSignalVelocity, computeCorroboration, computeEvidenceCoverage, bucketSignals } from "@/lib/analytics/signal-stats";
import { Card, EvidenceBadge, Pill, ProvenanceBadge, StatTile } from "@/components/ui";
import { TimeTravelPanel } from "@/components/TimeTravelPanel";
import { SignalTimelineChart } from "@/components/SignalTimelineChart";
import { researchGapsFor } from "@/lib/research-gaps";
import { CompanyExportBar } from "@/components/CompanyExportBar";

const THEME_LABELS: Record<string, string> = {
  ai_infrastructure: "AI Infrastructure",
  developer_tools: "Developer Tools",
  ai_applications: "AI Applications",
  vertical_ai: "Vertical AI",
  fintech_infrastructure: "Fintech Infrastructure",
};

const CATEGORY_TONE: Record<string, "slate" | "indigo" | "emerald" | "amber"> = {
  product: "indigo",
  technical: "emerald",
  commercial: "amber",
  founder: "indigo",
  organization: "slate",
  market: "slate",
};

export function generateStaticParams() {
  return companies.map((c) => ({ id: c.id }));
}

export default async function CompanyDetailPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();

  const signals = getSignalsForCompany(id);
  const milestones = getMilestonesForCompany(id);
  const companyFounders = getFoundersForCompany(id);
  const momentum = momentumFor(id);
  const asOf = snapshotMeta.snapshotDate;
  const velocity = computeSignalVelocity(signals, asOf);
  const corroboration = computeCorroboration(signals, sources, asOf);
  const coverage = computeEvidenceCoverage(signals, asOf);
  const companySources = signals.map((s) => getSourceRecord(s.sourceId)).filter((s): s is NonNullable<typeof s> => !!s);

  const dated = signals.filter((s) => s.availabilityDate !== null).map((s) => s.availabilityDate as string).sort();
  const earliestDate = dated[0] ?? asOf;
  const latestDate = dated[dated.length - 1] ?? asOf;
  const timelineBuckets = bucketSignals(signals, earliestDate, latestDate, Math.max(7, Math.round(daysBetween(earliestDate, latestDate) / 40)));

  const researchGaps = researchGapsFor(company, signals, companyFounders);
  const latestSignals = [...signals].sort((a, b) => (b.availabilityDate ?? "").localeCompare(a.availabilityDate ?? "")).slice(0, 8);
  const allByDate = [...signals].sort((a, b) => (b.availabilityDate ?? "").localeCompare(a.availabilityDate ?? ""));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      {/* --- Header --- */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold text-slate-900">{company.name}</h1>
            <Pill tone="indigo">{THEME_LABELS[company.theme]}</Pill>
          </div>
          <p className="mt-1 text-slate-600 max-w-xl">{company.oneLiner}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
              {company.website.replace(/^https?:\/\//, "")} ↗
            </a>
            <Pill>{company.githubOrg}</Pill>
            {company.stage && (
              <span className="text-xs text-slate-500 italic max-w-sm">{company.stage}</span>
            )}
          </div>
          <div className="mt-3">
            <CompanyExportBar company={company} signals={signals} sources={companySources} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Signal Momentum" value={momentum.momentum.toFixed(1)} sub={`${momentum.eligibleSignalCount} eligible signals`} />
          <StatTile label="Signal Velocity" value={velocity.toFixed(3) + "/day"} sub="trailing 30d" />
          <StatTile label="Signal Acceleration" value={momentum.accelerationMultiplier.toFixed(2) + "×"} sub="30d vs. prior 30d" />
          <StatTile label="Evidence coverage" value={`${coverage.covered.length}/6`} sub="categories with evidence" />
        </div>
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <FactRow label="Founded" value={company.foundedYear ? String(company.foundedYear) : "Unknown"} provenance={company.foundedYearProvenance} />
        <FactRow label="HQ" value={company.hqLocation ?? "Unknown"} provenance={company.hqLocation ? "source_reported" : "unknown"} />
        <FactRow label="Total raised" value={company.totalRaised ?? "Unknown"} provenance={company.totalRaisedProvenance} />
      </section>

      {companyFounders.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-900 mb-3">Founders</h2>
          <Card className="divide-y divide-slate-100">
            {companyFounders.map((f) => (
              <div key={f.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{f.name}</span>
                  <span className="text-sm text-slate-500 ml-2">{f.role}</span>
                  {f.previousCompanies.length > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">Previously: {f.previousCompanies.join(", ")}</div>
                  )}
                </div>
                <ProvenanceBadge provenance={f.provenance} />
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* --- Latest signals --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Latest signals</h2>
        <Card className="divide-y divide-slate-100">
          {latestSignals.map((s) => {
            const source = getSourceRecord(s.sourceId);
            return (
              <div key={s.id} className="p-4 flex items-start gap-3">
                <div className="w-24 shrink-0 text-xs font-mono text-slate-500 pt-0.5">{s.availabilityDate}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Pill tone={CATEGORY_TONE[s.category]}>{s.category}</Pill>
                    <EvidenceBadge level={s.evidenceLevel} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{s.headline}</p>
                  {source && (
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                      {source.title} ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      {/* --- Signal breakdown --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Signal breakdown</h2>
        <Card className="p-4 space-y-2">
          {Object.entries(momentum.byCategory).map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-3">
              <div className="w-28 text-sm text-slate-600 capitalize">{cat}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (val / Math.max(momentum.rawScore, 0.01)) * 100)}%` }}
                />
              </div>
              <div className="w-12 text-right text-sm font-mono text-slate-900">{val.toFixed(1)}</div>
            </div>
          ))}
          {coverage.missing.length > 0 && (
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              No evidence yet for: {coverage.missing.join(", ")} — unknown, not negative.
            </p>
          )}
        </Card>
      </section>

      {/* --- Corroboration --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Corroboration</h2>
        <Card className="p-4">
          <p className="text-sm text-slate-700">
            <span className="font-mono font-semibold">{corroboration.independentSignalCount}</span> independent signals across{" "}
            <span className="font-mono font-semibold">{corroboration.distinctSourceTypes}</span> source types and{" "}
            <span className="font-mono font-semibold">{corroboration.distinctCategories}</span> categories, in the trailing 90 days.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {corroboration.sourceTypes.map((t) => (
              <Pill key={t}>{t.replace("_", " ")}</Pill>
            ))}
            {corroboration.categories.map((c) => (
              <Pill key={c} tone={CATEGORY_TONE[c]}>{c}</Pill>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Evidence density, not a verdict: counts distinct source types and signal categories with at least one
            eligible signal in the window. Never implies investment merit.
          </p>
        </Card>
      </section>

      {/* --- Historical timeline --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Historical timeline</h2>
        <Card className="p-4">
          <SignalTimelineChart data={timelineBuckets} />
        </Card>
      </section>

      {/* --- What Did We Know Then? --- */}
      <TimeTravelPanel allSignals={signals} sources={sources} milestones={milestones} earliestDate={earliestDate} latestDate={latestDate} />

      {/* --- Milestones --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Milestones</h2>
        <Card className="divide-y divide-slate-100">
          {milestones.length === 0 && <p className="p-4 text-sm text-slate-400">No documented milestones for this company yet.</p>}
          {milestones.map((m) => {
            const source = getSourceRecord(m.sourceId);
            return (
              <div key={m.id} className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">{m.date}</span>
                  <Pill tone="amber">{m.type.replace("_", " ")}</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-700">{m.headline}</p>
                {source && (
                  <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                    {source.title} ↗
                  </a>
                )}
              </div>
            );
          })}
        </Card>
      </section>

      {/* --- Evidence (full chronological record) --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Evidence ({allByDate.length} signals)</h2>
        <Card className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {allByDate.map((s) => {
            const source = getSourceRecord(s.sourceId);
            return (
              <div key={s.id} className="p-3 flex items-start gap-3">
                <div className="w-24 shrink-0 text-xs font-mono text-slate-400 pt-0.5">{s.availabilityDate ?? "undated"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Pill tone={CATEGORY_TONE[s.category]}>{s.category}</Pill>
                    <EvidenceBadge level={s.evidenceLevel} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-700 truncate">{s.headline}</p>
                  {source && (
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                      {source.title} ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      {/* --- Research gaps --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Research gaps</h2>
        <Card className="divide-y divide-slate-100">
          {researchGaps.map((g, i) => (
            <div key={i} className="p-4 text-sm text-slate-700">{g}</div>
          ))}
        </Card>
      </section>

      {/* --- Source trail --- */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Source trail ({companySources.length})</h2>
        <Card className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {companySources.map((s) => (
            <div key={s.id} className="p-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-slate-700 truncate">{s.title}</div>
                {s.note && <div className="text-xs text-slate-400 truncate" title={s.note}>{s.note}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Pill>{s.type.replace("_", " ")}</Pill>
                <span className="text-xs font-mono text-slate-400">{s.publicationDate}</span>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                  Open ↗
                </a>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function FactRow({ label, value, provenance }: { label: string; value: string; provenance: Parameters<typeof ProvenanceBadge>[0]["provenance"] }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-slate-700">{value}</span>
        <ProvenanceBadge provenance={provenance} />
      </div>
    </Card>
  );
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
