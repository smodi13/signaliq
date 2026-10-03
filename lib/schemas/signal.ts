import { z } from "zod";
import {
  availabilityMethodSchema,
  evidenceLevelSchema,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  signalCategorySchema,
} from "./common";

/**
 * A single observed signal about a company. This is the normalization target
 * for every ingestion adapter: whatever the source, the rest of the system
 * sees the same shape.
 *
 * Three dates, on purpose:
 * - occurredDate: when the underlying thing actually happened (nullable —
 *   e.g. a repo's "created_at" is known; a founder's private decision isn't).
 * - availabilityDate: the earliest date this signal was *publicly knowable*.
 *   This is what historical replay (What Did We Know Then?) filters on.
 *   Never backfilled from occurredDate — if we can't establish it, it's null
 *   and the signal is excluded from every historical reconstruction.
 * - ingestedAt: when SignalIQ's adapter actually retrieved it. Audit-only;
 *   never affects historical eligibility (see lib/analytics/availability.ts).
 */
const signalObjectSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  category: signalCategorySchema,
  headline: z.string().min(1),
  sourceId: idSchema,
  evidenceLevel: evidenceLevelSchema,
  occurredDate: isoDateSchema.nullable(),
  availabilityDate: isoDateSchema.nullable(),
  availabilityMethod: availabilityMethodSchema,
  ingestedAt: isoDateTimeSchema,
  // Raw magnitude the adapter observed (stars, points, comments...) — used
  // by signal momentum as freshness/weight input, never shown as a vanity
  // metric on its own.
  weight: z.number().min(0).default(1),
});

function refineAvailability<T extends { availabilityDate: string | null; availabilityMethod: string }>(s: T) {
  return (s.availabilityDate === null) === (s.availabilityMethod === "not_established");
}

export const signalBaseSchema = signalObjectSchema.refine(refineAvailability, {
  message: "availabilityDate is null iff availabilityMethod is not_established",
  path: ["availabilityMethod"],
});
export type Signal = z.infer<typeof signalBaseSchema>;

export const signalDraftSchema = signalObjectSchema.omit({ ingestedAt: true }).refine(refineAvailability, {
  message: "availabilityDate is null iff availabilityMethod is not_established",
  path: ["availabilityMethod"],
});
export type SignalDraft = z.infer<typeof signalDraftSchema>;

export const milestoneTypeSchema = z.enum([
  "financing",
  "product_launch",
  "customer_announcement",
  "partnership",
  "acquisition",
  "other",
]);
export type MilestoneType = z.infer<typeof milestoneTypeSchema>;

/**
 * A documented, dated company event used as a backtest anchor. Milestones are
 * themselves sourced facts (sourceId required) — never inferred.
 */
export const milestoneSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  type: milestoneTypeSchema,
  headline: z.string().min(1),
  date: isoDateSchema,
  sourceId: idSchema,
});
export type Milestone = z.infer<typeof milestoneSchema>;
