import type { Signal } from "@/lib/schemas";

/**
 * The historical-replay rule, in one place. Every "What Did We Know Then?"
 * view and every backtest window must filter through this function — never
 * compare dates ad hoc at a call site.
 *
 * Filters on availabilityDate (when the signal was publicly knowable), never
 * occurredDate (when the underlying thing happened) and never ingestedAt
 * (when SignalIQ's own adapter happened to read it — irrelevant to what an
 * investor could have known on the cutoff date).
 */
export function isEligibleAsOf(signal: Signal, cutoff: string): boolean {
  return signal.availabilityDate !== null && signal.availabilityDate <= cutoff;
}

/** A signal with no established availabilityDate can never be used in a historical test, at any cutoff. */
export function isBacktestAdmissible(signal: Signal): boolean {
  return signal.availabilityDate !== null;
}

export function filterAsOf(signals: Signal[], cutoff: string): Signal[] {
  return signals.filter((s) => isEligibleAsOf(s, cutoff));
}
