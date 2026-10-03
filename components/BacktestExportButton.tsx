"use client";

import { downloadCsv } from "@/lib/csv";
import type { MilestoneBacktestResult } from "@/lib/analytics/backtest";

export function BacktestExportButton({ results }: { results: MilestoneBacktestResult[] }) {
  function exportResults() {
    const rows = results.flatMap((r) =>
      r.windows.map((w, i) => ({
        companyId: r.milestone.companyId,
        milestone: r.milestone.headline,
        milestoneDate: r.milestone.date,
        windowDays: w.windowDays,
        signalCount: w.signalCount,
        weightedIntensity: w.weightedIntensity.toFixed(3),
        sourceDiversity: w.sourceDiversity,
        categoryCount: w.categoryCount,
        leadDaysToEarliestSignal: w.leadDaysToEarliestSignal ?? "",
        baselineIntensity: r.baselines[i].weightedIntensity.toFixed(3),
      })),
    );
    downloadCsv("signaliq-backtest-results.csv", rows);
  }

  return (
    <button onClick={exportResults} className="text-xs rounded border border-slate-300 px-2.5 py-1 hover:bg-slate-50 print:hidden">
      Export backtest results (CSV)
    </button>
  );
}
