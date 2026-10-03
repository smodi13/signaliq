import { createHash } from "node:crypto";

/**
 * Deterministic id from a namespace + natural key, so re-running ingestion
 * against the same source produces the same id instead of a fresh random one
 * every time (required for stable company/signal identity across snapshots).
 */
export function stableId(namespace: string, ...parts: string[]): string {
  const hash = createHash("sha1").update([namespace, ...parts].join("::")).digest("hex");
  return `${namespace}_${hash.slice(0, 12)}`;
}
