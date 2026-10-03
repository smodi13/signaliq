import { stableId } from "@/lib/ids";
import type { SignalDraft, SourceRecord } from "@/lib/schemas";

const HN_ALGOLIA_API = "https://hn.algolia.com/api/v1";

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  created_at: string;
  points: number | null;
  num_comments: number | null;
  author: string;
}

interface HnSearchResponse {
  hits: HnHit[];
}

export interface HnIngestResult {
  signals: SignalDraft[];
  sources: SourceRecord[];
}

/**
 * Hacker News Algolia search adapter — no API key required. Searches stories
 * (not comments) mentioning the company name. availabilityDate is the HN
 * item's own created_at (availabilityMethod: platform_event_timestamp):
 * when the story became publicly visible, not when we queried it.
 */
export async function ingestHackerNews(companyId: string, query: string): Promise<HnIngestResult> {
  const now = new Date().toISOString();
  const url = `${HN_ALGOLIA_API}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`;
  const res = await fetch(url);
  if (!res.ok) return { signals: [], sources: [] };
  const data = (await res.json()) as HnSearchResponse;

  const sources: SourceRecord[] = [];
  const signals: SignalDraft[] = [];

  for (const hit of data.hits) {
    if (!hit.title) continue;
    const date = hit.created_at.slice(0, 10);
    const hnUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
    const sourceId = stableId("source", "hn", hit.objectID);
    sources.push({
      id: sourceId,
      type: "hacker_news",
      url: hnUrl,
      title: hit.title,
      publicationDate: date,
      availabilityMethod: "platform_event_timestamp",
      retrievedAt: now,
    });
    const points = hit.points ?? 0;
    signals.push({
      id: stableId("signal", "hn", companyId, hit.objectID),
      companyId,
      category: "market",
      headline: hit.title,
      sourceId,
      evidenceLevel: points >= 50 ? "B" : "C",
      occurredDate: date,
      availabilityDate: date,
      availabilityMethod: "platform_event_timestamp",
      weight: Math.log10(points + 10),
    });
  }

  return { signals, sources };
}
