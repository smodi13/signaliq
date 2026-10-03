import type { Milestone, Signal, SignalCategory, SourceRecord } from "@/lib/schemas";
import { isBacktestAdmissible } from "./availability";
import { EVIDENCE_LEVEL_WEIGHT } from "./signal-momentum";

export const BACKTEST_WINDOWS_DAYS = [30, 60, 90] as const;
export type BacktestWindowDays = (typeof BACKTEST_WINDOWS_DAYS)[number];

function daysBefore(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export interface WindowReading {
  windowDays: BacktestWindowDays;
  signalCount: number;
  weightedIntensity: number;
  velocity: number; // weightedIntensity / windowDays
  sourceDiversity: number; // distinct source types
  categoryCount: number; // distinct signal categories touched
  categories: string[];
  byCategory: Partial<Record<SignalCategory, number>>; // weighted intensity per category present
  evidenceQuality: number; // mean EVIDENCE_LEVEL_WEIGHT across signals in window, 0 if none
  leadDaysToEarliestSignal: number | null;
}

export interface BaselineReading {
  // The equal-length window immediately preceding the pre-milestone window,
  // i.e. for a 30-day window: days [-60, -30) before the milestone.
  windowDays: BacktestWindowDays;
  signalCount: number;
  weightedIntensity: number;
}

export interface WindowComparison {
  windowDays: BacktestWindowDays;
  // window weightedIntensity / baseline weightedIntensity. null when the
  // baseline is zero and the window is non-zero (undefined ratio — "new
  // activity with no prior baseline", not reported as a misleadingly large number).
  accelerationRatio: number | null;
}

export interface MilestoneBacktestResult {
  milestone: Milestone;
  windows: WindowReading[];
  baselines: BaselineReading[];
  comparisons: WindowComparison[];
  admissibleSignalCount: number;
  excludedForNoAvailabilityDate: number;
}

function readWindow(
  signals: Signal[],
  sourcesById: Map<string, SourceRecord>,
  milestoneDate: string,
  windowDays: BacktestWindowDays,
): WindowReading {
  const start = daysBefore(milestoneDate, windowDays);
  const inWindow = signals.filter(
    (s) => s.availabilityDate !== null && s.availabilityDate >= start && s.availabilityDate < milestoneDate,
  );
  const sourceTypes = new Set(inWindow.map((s) => sourcesById.get(s.sourceId)?.type).filter(Boolean));
  const categories = new Set(inWindow.map((s) => s.category));
  const earliestDate = inWindow.reduce<string | null>(
    (min, s) => (min === null || (s.availabilityDate as string) < min ? (s.availabilityDate as string) : min),
    null,
  );
  const weightedIntensity = inWindow.reduce((sum, s) => sum + s.weight, 0);
  const evidenceQuality = inWindow.length === 0 ? 0 : inWindow.reduce((sum, s) => sum + EVIDENCE_LEVEL_WEIGHT[s.evidenceLevel], 0) / inWindow.length;
  const byCategory: Partial<Record<SignalCategory, number>> = {};
  for (const s of inWindow) byCategory[s.category] = (byCategory[s.category] ?? 0) + s.weight;

  return {
    windowDays,
    signalCount: inWindow.length,
    weightedIntensity,
    velocity: weightedIntensity / windowDays,
    sourceDiversity: sourceTypes.size,
    categoryCount: categories.size,
    categories: [...categories],
    byCategory,
    evidenceQuality,
    leadDaysToEarliestSignal:
      earliestDate === null
        ? null
        : Math.round((new Date(milestoneDate).getTime() - new Date(earliestDate).getTime()) / 86_400_000),
  };
}

function readBaseline(
  signals: Signal[],
  milestoneDate: string,
  windowDays: BacktestWindowDays,
): BaselineReading {
  const end = daysBefore(milestoneDate, windowDays);
  const start = daysBefore(milestoneDate, windowDays * 2);
  const inWindow = signals.filter(
    (s) => s.availabilityDate !== null && s.availabilityDate >= start && s.availabilityDate < end,
  );
  return {
    windowDays,
    signalCount: inWindow.length,
    weightedIntensity: inWindow.reduce((sum, s) => sum + s.weight, 0),
  };
}

/**
 * For one milestone: read the 30/60/90-day pre-milestone windows and their
 * equal-length preceding baselines. Only availability-dated signals for the
 * same company are considered — see lib/analytics/availability.ts for why
 * occurredDate and ingestedAt never enter this comparison.
 */
export function backtestMilestone(
  milestone: Milestone,
  allSignals: Signal[],
  sources: SourceRecord[],
): MilestoneBacktestResult {
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const companySignals = allSignals.filter((s) => s.companyId === milestone.companyId);
  const admissible = companySignals.filter(isBacktestAdmissible);

  const windows = BACKTEST_WINDOWS_DAYS.map((d) => readWindow(admissible, sourcesById, milestone.date, d));
  const baselines = BACKTEST_WINDOWS_DAYS.map((d) => readBaseline(admissible, milestone.date, d));
  const comparisons: WindowComparison[] = BACKTEST_WINDOWS_DAYS.map((d, i) => {
    const w = windows[i].weightedIntensity;
    const b = baselines[i].weightedIntensity;
    return { windowDays: d, accelerationRatio: b === 0 ? (w === 0 ? 1 : null) : w / b };
  });

  return {
    milestone,
    windows,
    baselines,
    comparisons,
    admissibleSignalCount: admissible.length,
    excludedForNoAvailabilityDate: companySignals.length - admissible.length,
  };
}

export function backtestAllMilestones(
  milestones: Milestone[],
  signals: Signal[],
  sources: SourceRecord[],
): MilestoneBacktestResult[] {
  return milestones.map((m) => backtestMilestone(m, signals, sources));
}
