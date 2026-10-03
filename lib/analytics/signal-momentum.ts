import type { Signal, SignalCategory, EvidenceLevel, SourceRecord } from "@/lib/schemas";
import { isEligibleAsOf } from "./availability";

/**
 * Signal Momentum — a deterministic research-organization metric, not an
 * investment score. It answers "how much fresh, corroborated, diverse
 * activity is there right now", nothing more. Unknown information is never
 * converted into a penalty: a company with few eligible signals simply gets
 * a low or zero momentum, not a negative one.
 *
 * momentum = sum over eligible signals of
 *   weight(signal) * evidenceLevelWeight(level) * freshnessDecay(category, age)
 *   ... then scaled by a diversity multiplier and an acceleration multiplier.
 *
 * Every constant below is a reasoned starting point (documented on
 * /methodology), not a validated finding — see docs parity with
 * config/signals.yaml half-lives in the OriginationIQ reference this was
 * adapted from.
 */

// Half-life in days: how long until a signal's contribution decays to 50%.
export const CATEGORY_HALF_LIFE_DAYS: Record<SignalCategory, number> = {
  product: 60,
  technical: 45,
  commercial: 90,
  founder: 120,
  organization: 90,
  market: 120,
};

export const EVIDENCE_LEVEL_WEIGHT: Record<EvidenceLevel, number> = {
  A: 1.0,
  B: 0.75,
  C: 0.5,
  D: 0.25,
};

function daysBetween(earlier: string, later: string): number {
  const ms = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.max(0, ms / 86_400_000);
}

function freshnessDecay(category: SignalCategory, availabilityDate: string, asOf: string): number {
  const halfLife = CATEGORY_HALF_LIFE_DAYS[category];
  const age = daysBetween(availabilityDate, asOf);
  return Math.pow(0.5, age / halfLife);
}

export interface MomentumBreakdown {
  asOf: string;
  eligibleSignalCount: number;
  rawScore: number;
  diversityMultiplier: number;
  accelerationMultiplier: number;
  momentum: number;
  byCategory: Record<SignalCategory, number>;
}

/**
 * Distinct source *types* represented (github, hacker_news, rss, ...), not
 * distinct source records — repeated GitHub releases don't count as
 * diversity, a second independent channel corroborating the company does.
 */
function diversityMultiplier(signals: Signal[], sourcesById: Map<string, SourceRecord>): number {
  const types = new Set(
    signals.map((s) => sourcesById.get(s.sourceId)?.type).filter((t): t is NonNullable<typeof t> => !!t),
  );
  const distinctCount = types.size;
  return 1 + 0.1 * Math.min(Math.max(distinctCount - 1, 0), 4); // 1.0 .. 1.4
}

/**
 * Recent (0-30d) weighted activity vs prior (30-60d) window, as a bounded
 * ratio. 1.0 means flat; capped at [0.7, 1.5] so one sparse company isn't
 * swung wildly by a single old signal falling out of the prior window.
 */
function accelerationMultiplier(signals: Signal[], asOf: string): number {
  let recent = 0;
  let prior = 0;
  for (const s of signals) {
    if (!s.availabilityDate) continue;
    const ageDays = daysBetween(s.availabilityDate, asOf);
    const strength = s.weight * EVIDENCE_LEVEL_WEIGHT[s.evidenceLevel];
    if (ageDays <= 30) recent += strength;
    else if (ageDays <= 60) prior += strength;
  }
  if (recent === 0 && prior === 0) return 1;
  if (prior === 0) return 1.5;
  const ratio = recent / prior;
  return Math.min(1.5, Math.max(0.7, ratio));
}

export function computeSignalMomentum(
  signals: Signal[],
  sources: SourceRecord[],
  asOf: string,
): MomentumBreakdown {
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const eligible = signals.filter((s) => isEligibleAsOf(s, asOf));

  const byCategory: Record<SignalCategory, number> = {
    product: 0,
    technical: 0,
    commercial: 0,
    founder: 0,
    organization: 0,
    market: 0,
  };

  let rawScore = 0;
  for (const s of eligible) {
    const contribution =
      s.weight * EVIDENCE_LEVEL_WEIGHT[s.evidenceLevel] * freshnessDecay(s.category, s.availabilityDate as string, asOf);
    rawScore += contribution;
    byCategory[s.category] += contribution;
  }

  const diversity = diversityMultiplier(eligible, sourcesById);
  const acceleration = accelerationMultiplier(eligible, asOf);

  return {
    asOf,
    eligibleSignalCount: eligible.length,
    rawScore,
    diversityMultiplier: diversity,
    accelerationMultiplier: acceleration,
    momentum: rawScore * diversity * acceleration,
    byCategory,
  };
}
