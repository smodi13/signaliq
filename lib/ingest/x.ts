import type { SignalDraft, SourceRecord } from "@/lib/schemas";

export interface XIngestResult {
  signals: SignalDraft[];
  sources: SourceRecord[];
  skippedReason?: string;
}

/**
 * Optional X API connector. Requires X_BEARER_TOKEN; the public demo never
 * sets it, so this returns an explicit skip rather than fabricating data.
 * When implemented against the official API, apply the same rule as every
 * other adapter: availabilityDate comes from the post's own created_at
 * (availabilityMethod: platform_event_timestamp), never from retrieval time.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept parallel to the other adapters for when this is implemented
export async function ingestXPosts(_companyId: string, _query: string): Promise<XIngestResult> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    return { signals: [], sources: [], skippedReason: "X_BEARER_TOKEN not configured — optional connector skipped" };
  }
  // ponytail: not implemented. Wire to X API v2 recent search here when a
  // credential is available; until then this connector stays inert.
  return { signals: [], sources: [], skippedReason: "X connector not implemented in this build" };
}
