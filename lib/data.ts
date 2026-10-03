import companiesJson from "@/data/snapshot/companies.json";
import sourcesJson from "@/data/snapshot/sources.json";
import signalsJson from "@/data/snapshot/signals.json";
import milestonesJson from "@/data/snapshot/milestones.json";
import foundersJson from "@/data/snapshot/founders.json";
import relationshipsJson from "@/data/snapshot/relationships.json";
import metaJson from "@/data/snapshot/meta.json";
import type { Company, CompanyRelationship, Founder, Milestone, Signal, SourceRecord } from "@/lib/schemas";

/**
 * The one place the app reads research data from. This is a static,
 * committed snapshot produced by `scripts/ingest.ts` — the deployed app
 * never makes a live API call, so visiting the site costs nothing and never
 * depends on an upstream rate limit.
 */
export const companies = companiesJson as Company[];
export const sources = sourcesJson as SourceRecord[];
export const signals = signalsJson as Signal[];
export const milestones = milestonesJson as Milestone[];
export const founders = foundersJson as Founder[];
export const relationships = relationshipsJson as CompanyRelationship[];
export const snapshotMeta = metaJson as { snapshotDate: string; generatedAt: string };

export function getCompany(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function getSourcesById(): Map<string, SourceRecord> {
  return new Map(sources.map((s) => [s.id, s]));
}

export function getSignalsForCompany(companyId: string): Signal[] {
  return signals.filter((s) => s.companyId === companyId);
}

export function getMilestonesForCompany(companyId: string): Milestone[] {
  return milestones.filter((m) => m.companyId === companyId);
}

export function getFoundersForCompany(companyId: string): Founder[] {
  return founders.filter((f) => f.companyId === companyId);
}

export function getSourceRecord(sourceId: string): SourceRecord | undefined {
  return sources.find((s) => s.id === sourceId);
}
