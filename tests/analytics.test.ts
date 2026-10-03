import { test } from "node:test";
import assert from "node:assert/strict";
import { isEligibleAsOf, isBacktestAdmissible, filterAsOf } from "@/lib/analytics/availability";
import { computeSignalMomentum } from "@/lib/analytics/signal-momentum";
import { backtestMilestone } from "@/lib/analytics/backtest";
import type { Signal, SourceRecord, Milestone } from "@/lib/schemas";

function makeSignal(overrides: Partial<Signal>): Signal {
  return {
    id: "s1",
    companyId: "c1",
    category: "technical",
    headline: "test",
    sourceId: "src1",
    evidenceLevel: "A",
    occurredDate: "2024-01-01",
    availabilityDate: "2024-01-01",
    availabilityMethod: "repository_event",
    ingestedAt: new Date().toISOString(),
    weight: 1,
    ...overrides,
  };
}

const sources: SourceRecord[] = [
  {
    id: "src1",
    type: "github",
    url: "https://github.com/x/x",
    title: "x",
    publicationDate: "2024-01-01",
    availabilityMethod: "repository_event",
    retrievedAt: new Date().toISOString(),
  },
];

test("availability: cutoff rule never leaks future-availability signals", () => {
  const future = makeSignal({ availabilityDate: "2025-06-01" });
  assert.equal(isEligibleAsOf(future, "2025-01-01"), false);
  assert.equal(isEligibleAsOf(future, "2025-06-01"), true); // inclusive boundary
  assert.equal(isEligibleAsOf(future, "2025-12-31"), true);
});

test("availability: a null availabilityDate is never eligible, at any cutoff", () => {
  const undated = makeSignal({ availabilityDate: null, availabilityMethod: "not_established" });
  assert.equal(isEligibleAsOf(undated, "2099-01-01"), false);
  assert.equal(isBacktestAdmissible(undated), false);
});

test("availability: occurredDate never affects eligibility, only availabilityDate", () => {
  // Event happened in January, only became public in April.
  const delayed = makeSignal({ occurredDate: "2024-01-01", availabilityDate: "2024-04-01" });
  assert.equal(isEligibleAsOf(delayed, "2024-02-01"), false, "must not leak on occurredDate");
  assert.equal(isEligibleAsOf(delayed, "2024-04-01"), true);
});

test("filterAsOf filters a mixed list correctly", () => {
  const signals = [
    makeSignal({ id: "a", availabilityDate: "2024-01-01" }),
    makeSignal({ id: "b", availabilityDate: "2024-06-01" }),
    makeSignal({ id: "c", availabilityDate: null, availabilityMethod: "not_established" }),
  ];
  const eligible = filterAsOf(signals, "2024-03-01");
  assert.deepEqual(eligible.map((s) => s.id), ["a"]);
});

test("signal momentum: zero eligible signals yields zero momentum, not a negative value", () => {
  const result = computeSignalMomentum([], sources, "2024-01-01");
  assert.equal(result.momentum, 0);
  assert.equal(result.eligibleSignalCount, 0);
});

test("signal momentum: decays toward zero as cutoff moves away from availabilityDate", () => {
  const signal = makeSignal({ availabilityDate: "2024-01-01", category: "technical" });
  const near = computeSignalMomentum([signal], sources, "2024-01-05");
  const far = computeSignalMomentum([signal], sources, "2025-01-01");
  assert.ok(far.momentum < near.momentum, "momentum should decay over time");
  assert.ok(far.momentum >= 0, "momentum never goes negative");
});

test("backtest: excludes signals with no availabilityDate from every window", () => {
  const milestone: Milestone = {
    id: "m1",
    companyId: "c1",
    type: "product_launch",
    headline: "launched",
    date: "2024-06-01",
    sourceId: "src1",
  };
  const signals = [
    makeSignal({ id: "dated", availabilityDate: "2024-05-15" }),
    makeSignal({ id: "undated", availabilityDate: null, availabilityMethod: "not_established" }),
  ];
  const result = backtestMilestone(milestone, signals, sources);
  assert.equal(result.admissibleSignalCount, 1);
  assert.equal(result.excludedForNoAvailabilityDate, 1);
  const window30 = result.windows.find((w) => w.windowDays === 30)!;
  assert.equal(window30.signalCount, 1);
});

test("backtest: a signal after the milestone date is not counted in the pre-milestone window", () => {
  const milestone: Milestone = {
    id: "m1",
    companyId: "c1",
    type: "product_launch",
    headline: "launched",
    date: "2024-06-01",
    sourceId: "src1",
  };
  const afterMilestone = makeSignal({ id: "late", availabilityDate: "2024-06-15" });
  const result = backtestMilestone(milestone, [afterMilestone], sources);
  const window90 = result.windows.find((w) => w.windowDays === 90)!;
  assert.equal(window90.signalCount, 0);
});
