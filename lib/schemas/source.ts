import { z } from "zod";
import { availabilityMethodSchema, idSchema, isoDateSchema, isoDateTimeSchema, sourceTypeSchema } from "./common";

/**
 * A single citable source. Every evidence claim and signal points back to one
 * of these by id; nothing is displayed without a SourceRecord behind it.
 */
export const sourceRecordSchema = z
  .object({
    id: idSchema,
    type: sourceTypeSchema,
    url: z.url(),
    title: z.string().min(1),
    // When the underlying thing actually published/happened, per the source itself.
    publicationDate: isoDateSchema.nullable(),
    // How publicationDate was established — required whenever it is non-null.
    availabilityMethod: availabilityMethodSchema,
    // When SignalIQ's adapter actually retrieved this source.
    retrievedAt: isoDateTimeSchema,
    // Required when availabilityMethod is manual_verified: a human assertion
    // with no stated basis is the weakest evidence wearing the label of the
    // strongest. Also used to record a conservative date derivation (e.g. an
    // imported X post dated to a known run window rather than its own
    // timestamp) so the approximation is visible, not silent.
    note: z.string().min(1).optional(),
  })
  .refine(
    (s) => (s.publicationDate === null) === (s.availabilityMethod === "not_established"),
    {
      message:
        "publicationDate is null iff availabilityMethod is not_established",
      path: ["availabilityMethod"],
    },
  )
  .refine((s) => s.availabilityMethod !== "manual_verified" || !!s.note, {
    message: "manual_verified requires a note explaining the basis",
    path: ["note"],
  });
export type SourceRecord = z.infer<typeof sourceRecordSchema>;
