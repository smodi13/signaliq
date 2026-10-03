import { z } from "zod";
import { idSchema, provenanceSchema } from "./common";

/**
 * One fact, tied to the company it's about and the source(s) that support it.
 * Numeric values stay prose ("1.2k GitHub stars as of Oct 2026") unless a
 * computed metric derives from a source field directly (e.g. star count) —
 * SignalIQ does not parse unverified numbers out of text.
 */
export const evidenceClaimSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  statement: z.string().min(1),
  provenance: provenanceSchema,
  sourceIds: z.array(idSchema), // empty only when provenance is analyst_assessment or computed
  observedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export type EvidenceClaim = z.infer<typeof evidenceClaimSchema>;
