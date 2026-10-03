import { z } from "zod";

/**
 * Every displayed value is one of these. This is the single vocabulary for
 * how SignalIQ knows what it knows — never collapse these into each other.
 */
export const provenanceSchema = z.enum([
  "verified_fact", // independently corroborated, not just company-reported
  "source_reported", // stated by a source (company or third party), not independently corroborated
  "analyst_assessment", // a human judgment call, basis required
  "computed", // derived deterministically from other stored values
  "model_generated", // an LLM summary of sourced material — never a fact on its own
  "unknown", // not established; never backfilled or guessed
]);
export type Provenance = z.infer<typeof provenanceSchema>;

export const sourceTypeSchema = z.enum([
  "github",
  "hacker_news",
  "rss",
  "company_website",
  "company_blog",
  "company_docs",
  "x_post",
  "press",
  "other_public",
]);
export type SourceType = z.infer<typeof sourceTypeSchema>;

/**
 * How an availabilityDate was established. A null date must carry
 * not_established; a non-null date must carry anything else. Enforced in
 * signal.ts via refinement, not here, so this stays a plain enum.
 */
export const availabilityMethodSchema = z.enum([
  "intrinsic_timestamp", // the source's own publish/created_at timestamp
  "repository_event", // a commit, release, or star-history timestamp
  "platform_event_timestamp", // a platform created_at (HN item time, X post time)
  "manual_verified",
  "not_established",
]);
export type AvailabilityMethod = z.infer<typeof availabilityMethodSchema>;

export const signalCategorySchema = z.enum([
  "product",
  "technical",
  "commercial",
  "founder",
  "organization",
  "market",
]);
export type SignalCategory = z.infer<typeof signalCategorySchema>;

export const evidenceLevelSchema = z.enum([
  "A", // verified public product artifact (repo, live product page, docs)
  "B", // reported by a named, checkable source with a timestamp
  "C", // secondhand / aggregator / unverified claim
  "D", // speculative or unconfirmed
]);
export type EvidenceLevel = z.infer<typeof evidenceLevelSchema>;

export const researchStatusSchema = z.enum([
  "NEW",
  "RESEARCHING",
  "VERIFIED",
  "WATCH",
  "ARCHIVED",
]);
export type ResearchStatus = z.infer<typeof researchStatusSchema>;

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const isoDateTimeSchema = z.iso.datetime();

export const idSchema = z.string().min(1);
