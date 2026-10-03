import { signalDraftSchema, type SignalDraft, type Signal } from "@/lib/schemas";

/**
 * The only supported way to turn an adapter's draft into a stored Signal.
 * Stamps ingestedAt from the real clock and validates the draft — adapters
 * never set ingestedAt themselves (SignalDraft's type has no such field).
 */
export function ingest(draft: SignalDraft): Signal {
  const validated = signalDraftSchema.parse(draft);
  return { ...validated, ingestedAt: new Date().toISOString() };
}

export function ingestAll(drafts: SignalDraft[]): Signal[] {
  return drafts.map(ingest);
}
