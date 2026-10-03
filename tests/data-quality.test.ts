import { test } from "node:test";
import assert from "node:assert/strict";
import { companies, sources, signals, milestones, founders } from "@/lib/data";

/**
 * Validates invariants against the ACTUAL committed snapshot, not a fixture
 * — this is a regression test on real ingested data. If `npm run ingest`
 * ever produces a snapshot that breaks one of these, the build should fail
 * loudly rather than ship a corrupted corpus.
 */

const companyIds = new Set(companies.map((c) => c.id));
const sourceIds = new Set(sources.map((s) => s.id));

test("data quality: every signal references a real company and a real source", () => {
  for (const s of signals) {
    assert.ok(companyIds.has(s.companyId), `signal ${s.id} references unknown company ${s.companyId}`);
    assert.ok(sourceIds.has(s.sourceId), `signal ${s.id} references unknown source ${s.sourceId}`);
  }
});

test("data quality: every milestone references a real company and a real source", () => {
  for (const m of milestones) {
    assert.ok(companyIds.has(m.companyId), `milestone ${m.id} references unknown company ${m.companyId}`);
    assert.ok(sourceIds.has(m.sourceId), `milestone ${m.id} references unknown source ${m.sourceId}`);
  }
});

test("data quality: every founder references a real company and real sources", () => {
  for (const f of founders) {
    assert.ok(companyIds.has(f.companyId), `founder ${f.id} references unknown company ${f.companyId}`);
    for (const sid of f.sourceIds) {
      assert.ok(sourceIds.has(sid), `founder ${f.id} references unknown source ${sid}`);
    }
  }
});

test("data quality: no duplicate ids within companies, sources, signals, or milestones", () => {
  for (const [label, items] of [
    ["companies", companies],
    ["sources", sources],
    ["signals", signals],
    ["milestones", milestones],
  ] as const) {
    const ids = items.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id found among ${label}`);
  }
});

test("data quality: a signal's occurredDate never postdates its own availabilityDate", () => {
  for (const s of signals) {
    if (s.occurredDate !== null && s.availabilityDate !== null) {
      assert.ok(
        s.occurredDate <= s.availabilityDate,
        `signal ${s.id} has occurredDate ${s.occurredDate} after availabilityDate ${s.availabilityDate}`,
      );
    }
  }
});

test("data quality: every company's sourceIds resolve to real sources", () => {
  for (const c of companies) {
    for (const sid of c.sourceIds) {
      assert.ok(sourceIds.has(sid), `company ${c.id} references unknown source ${sid}`);
    }
  }
});

test("data quality: no company has an empty required field", () => {
  for (const c of companies) {
    assert.ok(c.name.trim().length > 0, `company ${c.id} has empty name`);
    assert.ok(c.oneLiner.trim().length > 0, `company ${c.id} has empty oneLiner`);
    assert.ok(c.website.startsWith("http"), `company ${c.id} has invalid website`);
  }
});

test("data quality: unknown facts are represented as null + unknown provenance, never a placeholder string", () => {
  const placeholders = ["TBD", "N/A", "unknown", "Unknown", "", "null", "undefined"];
  for (const c of companies) {
    if (c.hqLocation !== null) {
      assert.ok(!placeholders.includes(c.hqLocation), `company ${c.id} hqLocation looks like a placeholder: "${c.hqLocation}"`);
    }
    if (c.totalRaised !== null) {
      assert.ok(!placeholders.includes(c.totalRaised), `company ${c.id} totalRaised looks like a placeholder: "${c.totalRaised}"`);
    }
  }
});
