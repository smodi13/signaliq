import { stableId } from "@/lib/ids";
import type { SignalDraft, SourceRecord } from "@/lib/schemas";

interface FeedItem {
  title: string;
  link: string;
  pubDate: string; // raw, as found in the feed
}

// ponytail: regex-based RSS/Atom item extraction, not a full XML parser.
// Handles the common <item>/<entry> + <title>/<link>/<pubDate|published>
// shape used by most engineering-blog feeds. Swap for fast-xml-parser if a
// feed with CDATA-heavy or deeply nested markup breaks this.
function extractItems(xml: string): FeedItem[] {
  const blocks = xml.match(/<(item|entry)>[\s\S]*?<\/(item|entry)>/g) ?? [];
  const items: FeedItem[] = [];
  for (const block of blocks) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const linkMatch =
      block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const pubDate = block.match(/<(?:pubDate|published|updated)>([\s\S]*?)<\/(?:pubDate|published|updated)>/)?.[1]?.trim();
    if (title && linkMatch && pubDate) {
      items.push({ title, link: linkMatch, pubDate });
    }
  }
  return items;
}

export interface RssIngestResult {
  signals: SignalDraft[];
  sources: SourceRecord[];
}

/**
 * Public RSS/Atom feed adapter (company blogs, changelogs). availabilityDate
 * is the feed's own pubDate/published/updated timestamp
 * (availabilityMethod: intrinsic_timestamp) — a feed with no parseable date
 * per item contributes no signal rather than guessing one.
 */
export async function ingestRssFeed(companyId: string, feedUrl: string): Promise<RssIngestResult> {
  const now = new Date().toISOString();
  const res = await fetch(feedUrl);
  if (!res.ok) return { signals: [], sources: [] };
  const xml = await res.text();
  const items = extractItems(xml);

  const sources: SourceRecord[] = [];
  const signals: SignalDraft[] = [];

  for (const item of items) {
    const parsed = new Date(item.pubDate);
    if (Number.isNaN(parsed.getTime())) continue;
    const date = parsed.toISOString().slice(0, 10);
    const sourceId = stableId("source", "rss", item.link);
    sources.push({
      id: sourceId,
      type: "rss",
      url: item.link,
      title: item.title,
      publicationDate: date,
      availabilityMethod: "intrinsic_timestamp",
      retrievedAt: now,
    });
    signals.push({
      id: stableId("signal", "rss", item.link),
      companyId,
      category: "product",
      headline: item.title,
      sourceId,
      evidenceLevel: "A",
      occurredDate: date,
      availabilityDate: date,
      availabilityMethod: "intrinsic_timestamp",
      weight: 1,
    });
  }

  return { signals, sources };
}
