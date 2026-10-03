"use client";

import { useMemo, useState } from "react";
import type { Milestone, Signal, SourceRecord } from "@/lib/schemas";
import { filterAsOf } from "@/lib/analytics/availability";
import { computeSignalMomentum } from "@/lib/analytics/signal-momentum";
import { computeSignalVelocity, computeCorroboration, computeEvidenceCoverage } from "@/lib/analytics/signal-stats";
import { Card, EvidenceBadge, Pill } from "@/components/ui";

const CATEGORY_TONE: Record<string, "slate" | "indigo" | "emerald" | "amber"> = {
  product: "indigo",
  technical: "emerald",
  commercial: "amber",
  founder: "indigo",
  organization: "slate",
  market: "slate",
};

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatLong(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * "What Did We Know Then?" — SignalIQ's signature feature. Everything here
 * is computed client-side from the full signal/milestone set using the same
 * isEligibleAsOf / computeSignalMomentum / signal-stats functions the live
 * dashboard uses, filtered to a user-chosen cutoff date. Nothing published
 * after the cutoff is visible in the main reconstruction; the separate
 * "compare to today" panel is the only place later information appears, and
 * it is visually distinct and off by default.
 */
export function TimeTravelPanel({
  allSignals,
  sources,
  milestones,
  earliestDate,
  latestDate,
}: {
  allSignals: Signal[];
  sources: SourceRecord[];
  milestones: Milestone[];
  earliestDate: string;
  latestDate: string;
}) {
  const [cutoff, setCutoff] = useState(latestDate);
  const [showLater, setShowLater] = useState(false);
  const sourcesById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  const eligible = useMemo(() => filterAsOf(allSignals, cutoff), [allSignals, cutoff]);
  const discoveredLater = useMemo(
    () => allSignals.filter((s) => s.availabilityDate !== null && !eligible.includes(s)).sort((a, b) => (a.availabilityDate ?? "").localeCompare(b.availabilityDate ?? "")),
    [allSignals, eligible],
  );
  const momentum = useMemo(() => computeSignalMomentum(allSignals, sources, cutoff), [allSignals, sources, cutoff]);
  const velocity = useMemo(() => computeSignalVelocity(allSignals, cutoff), [allSignals, cutoff]);
  const corroboration = useMemo(() => computeCorroboration(allSignals, sources, cutoff), [allSignals, sources, cutoff]);
  const coverage = useMemo(() => computeEvidenceCoverage(allSignals, cutoff), [allSignals, cutoff]);

  const occurredMilestones = milestones.filter((m) => m.date <= cutoff);
  const futureMilestones = milestones.filter((m) => m.date > cutoff).sort((a, b) => a.date.localeCompare(b.date));

  const timeline = [...eligible].sort((a, b) => (b.availabilityDate ?? "").localeCompare(a.availabilityDate ?? ""));

  const jumpDates = useMemo(() => {
    const points = new Map<string, string>(); // date -> label
    for (const m of milestones) points.set(m.date, `Milestone: ${m.headline}`);
    const topSignals = [...allSignals]
      .filter((s) => s.availabilityDate)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    for (const s of topSignals) if (s.availabilityDate) points.set(s.availabilityDate, `Signal: ${s.headline}`);
    return [...points.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [allSignals, milestones]);

  return (
    <Card className="p-5 border-indigo-200 ring-1 ring-indigo-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-900 text-lg">What Did We Know Then?</h2>
          <p className="text-sm text-slate-500">Reconstruct the information available at any point in the company&apos;s history.</p>
        </div>
        <label className="text-sm text-slate-600">
          As of
          <input
            type="date"
            value={cutoff}
            min={earliestDate}
            max={latestDate}
            onChange={(e) => setCutoff(e.target.value)}
            className="ml-2 rounded border border-slate-300 px-2 py-1 text-sm font-mono"
          />
        </label>
      </div>

      <div className="mt-4 rounded-md bg-indigo-50 border border-indigo-200 px-4 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">As of</div>
        <div className="text-xl font-semibold text-indigo-900">{formatLong(cutoff)}</div>
        <div className="text-xs text-indigo-700 mt-0.5">Everything shown below was observable on or before this date.</div>
      </div>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
        Historical reconstruction uses only information whose source and observed dates make it available by the
        selected cutoff — never information whose availability date falls after it.
      </p>

      <input
        type="range"
        min={0}
        max={daysBetween(earliestDate, latestDate)}
        value={daysBetween(earliestDate, cutoff)}
        onChange={(e) => setCutoff(addDays(earliestDate, Number(e.target.value)))}
        className="w-full mt-4 accent-indigo-600"
        aria-label="Timeline scrubber"
      />
      <div className="flex justify-between text-xs text-slate-400 font-mono">
        <span>{earliestDate}</span>
        <span>{latestDate}</span>
      </div>

      {jumpDates.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400 self-center mr-1">Jump to:</span>
          {jumpDates.map(([date, label]) => (
            <button
              key={date}
              onClick={() => setCutoff(date)}
              title={label}
              className={`text-xs rounded-full px-2 py-0.5 border ${
                cutoff === date ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {date}
            </button>
          ))}
          <button onClick={() => setCutoff(latestDate)} className="text-xs rounded-full px-2 py-0.5 border border-slate-300 text-slate-600 hover:bg-slate-50">
            Today
          </button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Signal Momentum" value={momentum.momentum.toFixed(1)} sub={`${eligible.length} eligible signals`} />
        <Metric label="Signal Velocity" value={velocity.toFixed(3) + "/day"} sub="trailing 30 days" />
        <Metric label="Corroboration" value={`${corroboration.independentSignalCount} signals`} sub={`${corroboration.distinctSourceTypes} source types, ${corroboration.distinctCategories} categories`} />
        <Metric label="Evidence coverage" value={`${coverage.covered.length}/6`} sub={coverage.covered.join(", ") || "none yet"} />
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <div className="rounded-md border border-slate-200 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestones that had occurred</div>
          {occurredMilestones.length === 0 ? (
            <p className="text-sm text-slate-400 mt-1">None yet as of this date.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {occurredMilestones.map((m) => (
                <li key={m.id} className="text-sm text-slate-700">
                  <span className="font-mono text-xs text-slate-400 mr-1">{m.date}</span>
                  {m.headline}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-md border border-dashed border-slate-300 p-3 bg-slate-50">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestones not yet occurred (hidden from this view)</div>
          {futureMilestones.length === 0 ? (
            <p className="text-sm text-slate-400 mt-1">None — every tracked milestone had already occurred.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {futureMilestones.map((m) => (
                <li key={m.id} className="text-sm text-slate-500">
                  <span className="font-mono text-xs text-slate-400 mr-1">{m.date}</span>
                  {m.headline}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5 max-h-96 overflow-y-auto divide-y divide-slate-100 border-t border-slate-100">
        {timeline.length === 0 && <p className="py-6 text-sm text-slate-400 text-center">No eligible signals by this date.</p>}
        {timeline.map((s) => {
          const source = sourcesById.get(s.sourceId);
          return (
            <div key={s.id} className="py-3 flex items-start gap-3">
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
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <button onClick={() => setShowLater((v) => !v)} className="text-sm text-indigo-600 hover:underline">
          {showLater ? "Hide" : "Compare to today:"} {discoveredLater.length} signal{discoveredLater.length === 1 ? "" : "s"} discovered after {cutoff}
        </button>
        {showLater && (
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-100 bg-slate-50 rounded-md border border-slate-200">
            {discoveredLater.length === 0 && <p className="py-4 text-sm text-slate-400 text-center">Nothing — every known signal was already visible by this date.</p>}
            {discoveredLater.map((s) => (
              <div key={s.id} className="py-2.5 px-3 flex items-start gap-3 opacity-70">
                <div className="w-24 shrink-0 text-xs font-mono text-slate-400 pt-0.5">{s.availabilityDate}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Pill tone={CATEGORY_TONE[s.category]}>{s.category}</Pill>
                    <span className="text-[11px] text-slate-400 italic">not knowable as of {cutoff}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{s.headline}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-mono tabular-nums text-lg text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 truncate" title={sub}>{sub}</div>}
    </div>
  );
}
