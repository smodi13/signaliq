import type { Signal, SignalCategory, SourceRecord } from "@/lib/schemas";
import { isEligibleAsOf } from "./availability";
import { EVIDENCE_LEVEL_WEIGHT } from "./signal-momentum";

/**
 * Companion metrics to Signal Momentum (lib/analytics/signal-momentum.ts),
 * which is left unchanged here. These are separate, independently
 * deterministic readings — velocity, corroboration, evidence coverage — not
 * new components folded into the momentum formula.
 */

function daysBetween(earlier: string, later: string): number {
  return Math.max(0, (new Date(later).getTime() - new Date(earlier).getTime()) / 86_400_000);
}

/**
 * Signal velocity: weighted signal strength observed in the trailing window,
 * normalized to a per-day rate. Unlike momentum, this does not decay by
 * category half-life — it's a flat rate-of-activity reading over a fixed
 * window, meant to answer "how much is happening per day right now."
 */
export function computeSignalVelocity(signals: Signal[], asOf: string, windowDays = 30): number {
  const eligible = signals.filter((s) => isEligibleAsOf(s, asOf));
  let total = 0;
  for (const s of eligible) {
    const age = daysBetween(s.availabilityDate as string, asOf);
    if (age <= windowDays) total += s.weight * EVIDENCE_LEVEL_WEIGHT[s.evidenceLevel];
  }
  return total / windowDays;
}

export interface CorroborationReading {
  windowDays: number;
  independentSignalCount: number;
  distinctSourceTypes: number;
  distinctCategories: number;
  sourceTypes: string[];
  categories: SignalCategory[];
}

/**
 * Evidence density over a trailing window: how many independent signals,
 * across how many source types and categories, point at the same company
 * right now. This is corroboration — cross-source agreement — not a
 * judgment about investment merit, and it is never collapsed into momentum.
 */
export function computeCorroboration(
  signals: Signal[],
  sources: SourceRecord[],
  asOf: string,
  windowDays = 90,
): CorroborationReading {
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const eligible = signals.filter((s) => isEligibleAsOf(s, asOf));
  const inWindow = eligible.filter((s) => daysBetween(s.availabilityDate as string, asOf) <= windowDays);

  const sourceTypes = new Set<string>();
  const categories = new Set<SignalCategory>();
  for (const s of inWindow) {
    const type = sourcesById.get(s.sourceId)?.type;
    if (type) sourceTypes.add(type);
    categories.add(s.category);
  }

  return {
    windowDays,
    independentSignalCount: inWindow.length,
    distinctSourceTypes: sourceTypes.size,
    distinctCategories: categories.size,
    sourceTypes: [...sourceTypes],
    categories: [...categories],
  };
}

const ALL_CATEGORIES: SignalCategory[] = ["product", "technical", "commercial", "founder", "organization", "market"];

/**
 * Evidence coverage: of the six signal categories, how many have at least
 * one eligible signal right now. A 2/6 reading is not a penalty — it states
 * plainly which categories have no public evidence yet.
 */
export function computeEvidenceCoverage(signals: Signal[], asOf: string): { covered: SignalCategory[]; missing: SignalCategory[] } {
  const eligible = signals.filter((s) => isEligibleAsOf(s, asOf));
  const present = new Set(eligible.map((s) => s.category));
  return {
    covered: ALL_CATEGORIES.filter((c) => present.has(c)),
    missing: ALL_CATEGORIES.filter((c) => !present.has(c)),
  };
}

export interface TimeBucket {
  date: string; // bucket start, YYYY-MM-DD
  count: number;
  weighted: number;
}

/**
 * Buckets eligible signals into fixed-width day windows between two dates,
 * for timeline/velocity charts. Every bucket is emitted even when empty, so
 * a chart never silently skips a quiet period.
 */
export function bucketSignals(signals: Signal[], start: string, end: string, bucketDays = 7): TimeBucket[] {
  const eligible = signals.filter((s) => s.availabilityDate !== null && s.availabilityDate >= start && s.availabilityDate <= end);
  const buckets: TimeBucket[] = [];
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const bucketMs = bucketDays * 86_400_000;
  for (let t = startMs; t <= endMs; t += bucketMs) {
    const bucketStart = new Date(t).toISOString().slice(0, 10);
    const bucketEnd = new Date(Math.min(t + bucketMs, endMs + 1)).toISOString().slice(0, 10);
    const inBucket = eligible.filter((s) => s.availabilityDate! >= bucketStart && s.availabilityDate! < bucketEnd);
    buckets.push({
      date: bucketStart,
      count: inBucket.length,
      weighted: inBucket.reduce((sum, s) => sum + s.weight * EVIDENCE_LEVEL_WEIGHT[s.evidenceLevel], 0),
    });
  }
  return buckets;
}
