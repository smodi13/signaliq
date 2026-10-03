import { getCompany, milestones, signals, sources } from "@/lib/data";
import { backtestAllMilestones, BACKTEST_WINDOWS_DAYS } from "@/lib/analytics/backtest";
import { Card, Pill } from "@/components/ui";
import { BacktestChart, type AggregateRow } from "@/components/BacktestChart";
import { BacktestExportButton } from "@/components/BacktestExportButton";
import { LeadTimeHistogram } from "@/components/LeadTimeHistogram";
import type { SignalCategory } from "@/lib/schemas";

const CATEGORIES: SignalCategory[] = ["product", "technical", "commercial", "founder", "organization", "market"];

export default function BacktestPage() {
  const results = backtestAllMilestones(milestones, signals, sources);
  const by90d = results.map((r) => r.windows.find((w) => w.windowDays === 90)!);

  const aggregate: AggregateRow[] = BACKTEST_WINDOWS_DAYS.map((windowDays) => {
    const windowReadings = results.map((r) => r.windows.find((w) => w.windowDays === windowDays)!);
    const baselineReadings = results.map((r) => r.baselines.find((b) => b.windowDays === windowDays)!);
    return {
      windowDays,
      windowIntensity: avg(windowReadings.map((w) => w.weightedIntensity)),
      baselineIntensity: avg(baselineReadings.map((b) => b.weightedIntensity)),
    };
  });

  const leadDays = by90d.map((w) => w.leadDaysToEarliestSignal).filter((d): d is number => d !== null);

  const categoryTotals: Partial<Record<SignalCategory, number>> = {};
  for (const w of by90d) for (const [cat, val] of Object.entries(w.byCategory)) categoryTotals[cat as SignalCategory] = (categoryTotals[cat as SignalCategory] ?? 0) + (val ?? 0);
  const categoryMax = Math.max(1, ...Object.values(categoryTotals));

  const milestoneTypesSeen = [...new Set(results.map((r) => r.milestone.type))];
  const byCompany = new Map<string, typeof results>();
  for (const r of results) {
    const list = byCompany.get(r.milestone.companyId) ?? [];
    list.push(r);
    byCompany.set(r.milestone.companyId, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Historical Signal Analysis</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Backtest Lab</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Tests whether observable signals tended to cluster in the days before a documented milestone, against an
            equal-length earlier baseline, across {results.length} milestones ({milestoneTypesSeen.join(", ").replace(/_/g, " ")}).
          </p>
        </div>
        <BacktestExportButton results={results} />
      </div>

      <div className="border-l-2 border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Historical observational analysis. Not predictive performance.</span>{" "}
        This measures correlation between past public signal activity and milestone timing — it is not a prediction
        engine and makes no claim about investment outcomes or statistical significance.
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-2">Aggregate signal intensity: pre-milestone window vs. baseline</h2>
        <p className="text-xs text-slate-500 mb-2">Averaged across {results.length} milestones currently tracked, by window size.</p>
        <BacktestChart data={aggregate} />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-2">Lead-time distribution</h2>
          <p className="text-xs text-slate-500 mb-2">Days before the milestone that the earliest eligible signal (90-day window) appeared.</p>
          <LeadTimeHistogram leadDays={leadDays} />
          {leadDays.length < results.length && (
            <p className="text-xs text-slate-400 mt-1">
              {results.length - leadDays.length} milestone(s) had no eligible pre-milestone signal at all.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-2">Signal category composition</h2>
          <p className="text-xs text-slate-500 mb-2">Weighted intensity by category, summed across all 90-day pre-milestone windows.</p>
          <div className="space-y-2 mt-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600 capitalize">{cat}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${((categoryTotals[cat] ?? 0) / categoryMax) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-xs font-mono text-slate-900">{(categoryTotals[cat] ?? 0).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="space-y-6">
        <h2 className="font-semibold text-slate-900">Results by company</h2>
        {[...byCompany.entries()].map(([companyId, companyResults]) => {
          const company = getCompany(companyId);
          return (
            <div key={companyId}>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">{company?.name}</h3>
              <div className="space-y-4">
                {companyResults.map((r) => (
                  <Card key={r.milestone.id} className="p-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone="amber">{r.milestone.type.replace("_", " ")}</Pill>
                      <span className="text-xs font-mono text-slate-500">{r.milestone.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{r.milestone.headline}</p>
                    {r.excludedForNoAvailabilityDate > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {r.excludedForNoAvailabilityDate} signal(s) excluded from this test: no established availability date.
                      </p>
                    )}

                    <div className="overflow-x-auto">
                      <table className="mt-4 w-full text-sm">
                        <thead className="text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="text-left font-medium py-1.5">Window</th>
                            <th className="text-right font-medium py-1.5">Signals</th>
                            <th className="text-right font-medium py-1.5">Intensity</th>
                            <th className="text-right font-medium py-1.5">Velocity/day</th>
                            <th className="text-right font-medium py-1.5">Acceleration</th>
                            <th className="text-right font-medium py-1.5">Source diversity</th>
                            <th className="text-right font-medium py-1.5">Categories</th>
                            <th className="text-right font-medium py-1.5">Evidence quality</th>
                            <th className="text-right font-medium py-1.5">Lead days</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {r.windows.map((w, i) => (
                            <tr key={w.windowDays}>
                              <td className="py-1.5 font-mono">{w.windowDays}d</td>
                              <td className="py-1.5 text-right font-mono">{w.signalCount}</td>
                              <td className="py-1.5 text-right font-mono">{w.weightedIntensity.toFixed(2)}</td>
                              <td className="py-1.5 text-right font-mono">{w.velocity.toFixed(3)}</td>
                              <td className="py-1.5 text-right font-mono">
                                {r.comparisons[i].accelerationRatio === null ? "new" : `${r.comparisons[i].accelerationRatio!.toFixed(2)}×`}
                              </td>
                              <td className="py-1.5 text-right font-mono">{w.sourceDiversity}</td>
                              <td className="py-1.5 text-right font-mono">{w.categoryCount}</td>
                              <td className="py-1.5 text-right font-mono">{w.evidenceQuality.toFixed(2)}</td>
                              <td className="py-1.5 text-right font-mono">{w.leadDaysToEarliestSignal ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <Card className="p-5 bg-slate-50 border-slate-200">
        <h2 className="font-semibold text-slate-900 mb-2">Methodological limitations</h2>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li><strong>Selection bias:</strong> the corpus was chosen because each company had strong public GitHub/HN/X signal — not a random sample of the technology universe.</li>
          <li><strong>Survivorship bias:</strong> every tracked company still exists and is still active (with one acquisition); companies that failed or went dark before being discovered are structurally absent.</li>
          <li><strong>Uneven category coverage:</strong> technical and market signals dominate the corpus; commercial, founder, and organization signals are present but thin (see /methodology). Backtest category composition reflects that imbalance, not the real-world distribution of a company&apos;s activity.</li>
          <li><strong>Milestone count:</strong> {results.length} milestones across {milestoneTypesSeen.length} types is enough to exercise the harness across real, diverse evidence — not enough for a statistically reliable conclusion.</li>
          <li>No result on this page is, or should be read as, a prediction of future investment performance. Historical correlation does not establish causality.</li>
        </ul>
      </Card>
    </div>
  );
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
