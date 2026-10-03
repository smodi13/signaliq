import { stableId } from "@/lib/ids";
import type { SignalDraft, SourceRecord, SignalCategory, EvidenceLevel } from "@/lib/schemas";
import candidatesFile from "@/data/external/x-sourcing-engine/candidates.json";

/**
 * Normalizes sanitized outputs from the author's existing governed X sourcing
 * engine (see data/external/x-sourcing-engine/PROVENANCE.md) into SignalIQ's
 * Signal/SourceRecord shape. This is NOT a live X API connector — it replays
 * a completed, already-sanitized run. A live connector using the same
 * official-API, budget-governed methodology belongs in lib/ingest/x.ts and
 * is a separate, as-yet-unimplemented path (see that file).
 */

interface ShowcaseCandidate {
  name: string;
  slug: string;
  sector_bucket: string;
  post_url: string;
  artifact_urls: string[];
  artifact_types: string[];
  announcement_attribution: string;
  evidence_levels: string[];
  company_status: string;
  research_score: number;
  reason_codes: string[];
}

const CANDIDATES = (candidatesFile as { candidates: ShowcaseCandidate[] }).candidates;

// The sanitized output carries no per-post timestamp — see PROVENANCE.md for
// why this conservative upper-bound date is the only defensible one.
const RUN_GENERATED_DATE = "2026-07-22";
const AVAILABILITY_NOTE =
  "No per-post timestamp survived sanitization of the source run. Dated to the run's generation timestamp " +
  "(2026-07-22T17:41:36Z) as a conservative upper bound — the underlying X post predates this date, derived " +
  "from a 7-day recent-search window. See data/external/x-sourcing-engine/PROVENANCE.md.";

function strongestEvidenceLevel(levels: string[]): EvidenceLevel {
  for (const l of ["A", "B", "C", "D"] as const) {
    if (levels.includes(l)) return l;
  }
  return "D";
}

function categoryFor(candidate: ShowcaseCandidate): SignalCategory {
  if (candidate.announcement_attribution === "direct_builder_claim") return "founder";
  if (candidate.artifact_types.includes("github_repository")) return "technical";
  return "product";
}

export function findShowcaseCandidate(slug: string): ShowcaseCandidate | undefined {
  return CANDIDATES.find((c) => c.slug === slug);
}

export interface XShowcaseIngestResult {
  signals: SignalDraft[];
  sources: SourceRecord[];
}

/**
 * Builds one founder/technical signal from a single sanitized X candidate,
 * for a company SignalIQ has already decided (by hand, after checking the
 * artifact resolves live) to track. Every field traces back to the sanitized
 * record untouched — nothing here is inferred beyond the date derivation
 * documented above.
 */
export function ingestXShowcaseCandidate(companyId: string, slug: string): XShowcaseIngestResult {
  const candidate = findShowcaseCandidate(slug);
  if (!candidate) return { signals: [], sources: [] };

  const now = new Date().toISOString();
  const sourceId = stableId("source", "x-showcase", candidate.slug, candidate.post_url);
  const source: SourceRecord = {
    id: sourceId,
    type: "x_post",
    url: candidate.post_url,
    title: `${candidate.name}: X builder post (sanitized replay)`,
    publicationDate: RUN_GENERATED_DATE,
    availabilityMethod: "manual_verified",
    retrievedAt: now,
    note: AVAILABILITY_NOTE,
  };

  const attributionLabel =
    candidate.announcement_attribution === "direct_builder_claim"
      ? "direct builder claim"
      : candidate.announcement_attribution.replace(/_/g, " ");

  const signal: SignalDraft = {
    id: stableId("signal", "x-showcase", candidate.slug),
    companyId,
    category: categoryFor(candidate),
    headline: `${candidate.name}: builder posted on X (${attributionLabel}, verified public artifact)`,
    sourceId,
    evidenceLevel: strongestEvidenceLevel(candidate.evidence_levels),
    occurredDate: null, // not established — see PROVENANCE.md
    availabilityDate: RUN_GENERATED_DATE,
    availabilityMethod: "manual_verified",
    weight: 1,
  };

  return { signals: [signal], sources: [source] };
}
