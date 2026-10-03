import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSignalVelocity, computeCorroboration, computeEvidenceCoverage, bucketSignals } from "@/lib/analytics/signal-stats";
import type { Signal, SourceRecord } from "@/lib/schemas";

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
  { id: "src1", type: "github", url: "https://github.com/x/x", title: "x", publicationDate: "2024-01-01", availabilityMethod: "repository_event", retrievedAt: new Date().toISOString() },
  { id: "src2", type: "hacker_news", url: "https://news.ycombinator.com/item?id=1", title: "y", publicationDate: "2024-01-01", availabilityMethod: "platform_event_timestamp", retrievedAt: new Date().toISOString() },
];

test("signal velocity: only counts signals within the trailing window", () => {
  const inWindow = makeSignal({ id: "a", availabilityDate: "2024-01-20" });
  const outWindow = makeSignal({ id: "b", availabilityDate: "2023-11-01" });
  const velocity = computeSignalVelocity([inWindow, outWindow], "2024-01-25", 30);
  assert.ok(velocity > 0);
  // Only "a" contributes: weight 1 * evidence A weight 1.0 / 30 days
  assert.ok(Math.abs(velocity - 1 / 30) < 1e-9);
});

test("signal velocity: respects the historical cutoff, never counting future signals", () => {
  const future = makeSignal({ id: "a", availabilityDate: "2024-06-01" });
  const velocity = computeSignalVelocity([future], "2024-01-01", 30);
  assert.equal(velocity, 0);
});

test("corroboration: counts distinct source types and categories within the window", () => {
  const signals = [
    makeSignal({ id: "a", sourceId: "src1", category: "technical", availabilityDate: "2024-01-01" }),
    makeSignal({ id: "b", sourceId: "src2", category: "market", availabilityDate: "2024-01-05" }),
  ];
  const result = computeCorroboration(signals, sources, "2024-01-10", 90);
  assert.equal(result.independentSignalCount, 2);
  assert.equal(result.distinctSourceTypes, 2);
  assert.equal(result.distinctCategories, 2);
});

test("evidence coverage: reports missing categories honestly, not as a penalty", () => {
  const signals = [makeSignal({ category: "technical" })];
  const { covered, missing } = computeEvidenceCoverage(signals, "2024-06-01");
  assert.deepEqual(covered, ["technical"]);
  assert.equal(missing.length, 5);
});

test("bucketSignals: emits an entry for every bucket, including empty ones", () => {
  const signals = [makeSignal({ availabilityDate: "2024-01-01" })];
  const buckets = bucketSignals(signals, "2024-01-01", "2024-01-21", 7);
  assert.equal(buckets.length, 3);
  assert.equal(buckets[0].count, 1);
  assert.equal(buckets[1].count, 0);
  assert.equal(buckets[2].count, 0);
});
