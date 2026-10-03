import { z } from "zod";
import { idSchema, isoDateSchema, provenanceSchema } from "./common";

export const founderSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  previousCompanies: z.array(z.string()).default([]),
  provenance: provenanceSchema,
  sourceIds: z.array(idSchema),
});
export type Founder = z.infer<typeof founderSchema>;

export const investorSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  companyIds: z.array(idSchema).default([]),
  provenance: provenanceSchema,
  sourceIds: z.array(idSchema),
});
export type Investor = z.infer<typeof investorSchema>;

export const customerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  companyIds: z.array(idSchema).default([]), // vendor relationship(s)
  provenance: provenanceSchema,
  sourceIds: z.array(idSchema),
});
export type Customer = z.infer<typeof customerSchema>;

export const productSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  launchDate: isoDateSchema.nullable(),
  provenance: provenanceSchema,
  sourceIds: z.array(idSchema),
});
export type Product = z.infer<typeof productSchema>;

export const marketThemeSchema = z.enum([
  "ai_infrastructure",
  "developer_tools",
  "ai_applications",
  "vertical_ai",
  "fintech_infrastructure",
]);
export type MarketTheme = z.infer<typeof marketThemeSchema>;

export const companySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  website: z.url(),
  githubOrg: z.string().nullable(),
  oneLiner: z.string().min(1),
  theme: marketThemeSchema,
  foundedYear: z.number().int().nullable(),
  foundedYearProvenance: provenanceSchema,
  hqLocation: z.string().nullable(),
  totalRaised: z.string().nullable(), // prose ("unknown" stays null, not 0) — see evidence.ts for why
  totalRaisedProvenance: provenanceSchema,
  // Free-text, not a funding-round enum: public evidence rarely states a
  // clean stage label, so this is either null (unknown) or an analyst
  // assessment that says what it's based on (e.g. evidence depth), never a
  // guessed Series letter.
  stage: z.string().nullable(),
  stageProvenance: provenanceSchema,
  sourceIds: z.array(idSchema),
});
export type Company = z.infer<typeof companySchema>;

export const relationshipTypeSchema = z.enum([
  "founder_of",
  "previously_founded",
  "invested_in",
  "customer_of",
  "competitor_of",
  "built_with", // technology/platform dependency
  "uses_repository",
]);
export type RelationshipType = z.infer<typeof relationshipTypeSchema>;

/**
 * An edge in the company intelligence graph. Every edge carries at least one
 * source — nothing is connected because a model inferred it.
 */
export const companyRelationshipSchema = z.object({
  id: idSchema,
  type: relationshipTypeSchema,
  fromId: idSchema, // company, founder, investor, or customer id
  toId: idSchema,
  sourceIds: z.array(idSchema).min(1),
});
export type CompanyRelationship = z.infer<typeof companyRelationshipSchema>;

export const researchGapSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  question: z.string().min(1),
  openedDate: isoDateSchema,
});
export type ResearchGap = z.infer<typeof researchGapSchema>;

export const analystNoteSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  status: z.enum(["NEW", "RESEARCHING", "VERIFIED", "WATCH", "ARCHIVED"]),
  note: z.string().default(""),
  updatedAt: z.iso.datetime(),
});
export type AnalystNote = z.infer<typeof analystNoteSchema>;
